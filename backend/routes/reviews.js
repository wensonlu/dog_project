const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const checkSupabase = require('../middleware/supabaseCheck');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 配置图片上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/reviews/';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只允许上传图片文件'));
    }
});

// 获取指定宠物的所有评价
router.get('/:dogId', checkSupabase, async (req, res) => {
    try {
        const { dogId } = req.params;
        const userId = req.user?.id;

        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('dog_id', dogId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const reviewIds = reviews.map(r => r.id);

        const { data: likeCounts } = await supabase
            .from('review_likes')
            .select('review_id')
            .in('review_id', reviewIds);

        const likeCountMap = {};
        likeCounts?.forEach(like => {
            likeCountMap[like.review_id] = (likeCountMap[like.review_id] || 0) + 1;
        });

        let userLikes = [];
        if (userId && reviewIds.length > 0) {
            const { data } = await supabase
                .from('review_likes')
                .select('review_id')
                .eq('user_id', userId)
                .in('review_id', reviewIds);
            userLikes = data?.map(l => l.review_id) || [];
        }

        const { data: users } = await supabase.auth.admin.listUsers();
        const userMap = {};
        users?.users.forEach(u => {
            userMap[u.id] = u.email?.split('@')[0] || '匿名用户';
        });

        const formattedReviews = reviews.map(review => ({
            ...review,
            username: userMap[review.user_id] || '匿名用户',
            likes_count: likeCountMap[review.id] || 0,
            user_liked: userLikes.includes(review.id) ? 1 : 0
        }));

        res.json({ reviews: formattedReviews });
    } catch (error) {
        console.error('获取评价失败:', error);
        res.status(500).json({ message: '获取评价失败' });
    }
});

// 创建评价
router.post('/', checkSupabase, upload.array('photos', 3), async (req, res) => {
    try {
        const { applicationId, dogId, rating, content } = req.body;
        const userId = req.user.id;

        if (!applicationId || !dogId || !rating || !content) {
            return res.status(400).json({ message: '请填写完整的评价信息' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: '评分必须在 1-5 之间' });
        }

        if (content.length < 10 || content.length > 500) {
            return res.status(400).json({ message: '评价内容需在 10-500 字之间' });
        }

        const { data: applications, error: appError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .eq('user_id', userId)
            .eq('dog_id', dogId)
            .single();

        if (appError || !applications) {
            return res.status(403).json({ message: '您没有权限评价该宠物' });
        }

        if (applications.status !== 'approved') {
            return res.status(403).json({ message: '只有成功领养的用户才能评价' });
        }

        const { data: existingReviews } = await supabase
            .from('reviews')
            .select('id')
            .eq('application_id', applicationId);

        if (existingReviews && existingReviews.length > 0) {
            return res.status(400).json({ message: '您已经评价过该领养申请了' });
        }

        const photos = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : null;

        const { data: newReview, error: insertError } = await supabase
            .from('reviews')
            .insert({
                application_id: applicationId,
                user_id: userId,
                dog_id: dogId,
                rating: parseInt(rating),
                content,
                photos
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const { data: userData } = await supabase.auth.admin.getUserById(userId);

        const formattedReview = {
            ...newReview,
            username: userData?.user?.email?.split('@')[0] || '匿名用户',
            likes_count: 0,
            user_liked: 0
        };

        res.status(201).json({
            message: '评价发布成功',
            review: formattedReview
        });
    } catch (error) {
        console.error('创建评价失败:', error);
        res.status(500).json({ message: '创建评价失败' });
    }
});

// 点赞/取消点赞
router.post('/:reviewId/like', checkSupabase, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .select('id')
            .eq('id', reviewId)
            .single();

        if (reviewError || !review) {
            return res.status(404).json({ message: '评价不存在' });
        }

        const { data: existingLike } = await supabase
            .from('review_likes')
            .select('id')
            .eq('review_id', reviewId)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            await supabase
                .from('review_likes')
                .delete()
                .eq('review_id', reviewId)
                .eq('user_id', userId);

            res.json({ message: '已取消点赞', liked: false });
        } else {
            const { error: likeError } = await supabase
                .from('review_likes')
                .insert({ review_id: reviewId, user_id: userId });

            if (likeError) throw likeError;

            res.json({ message: '点赞成功', liked: true });
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({ message: '点赞操作失败' });
    }
});

// 检查评价资格
router.get('/check-eligibility/:dogId', checkSupabase, async (req, res) => {
    try {
        const { dogId } = req.params;
        const userId = req.user.id;

        const { data: applications, error: appError } = await supabase
            .from('applications')
            .select('id')
            .eq('dog_id', dogId)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1);

        if (appError) throw appError;

        if (!applications || applications.length === 0) {
            return res.json({
                eligible: false,
                reason: 'no_approved_application',
                message: '您还没有成功领养该宠物'
            });
        }

        const application = applications[0];

        const { data: existingReviews } = await supabase
            .from('reviews')
            .select('id')
            .eq('application_id', application.id);

        if (existingReviews && existingReviews.length > 0) {
            return res.json({
                eligible: false,
                reason: 'already_reviewed',
                message: '您已经评价过了'
            });
        }

        res.json({
            eligible: true,
            applicationId: application.id,
            message: '您可以评价该宠物'
        });
    } catch (error) {
        console.error('检查评价资格失败:', error);
        res.status(500).json({ message: '检查评价资格失败' });
    }
});

module.exports = router;
