const { supabase } = require('../config/supabase');
const { getSupabaseClient } = require('../utils/supabaseClient');
const { generatePetBio } = require('../utils/ai');

/**
 * Submit dog submission (user wants to give away their dog)
 */
async function submitDogSubmission(req, res) {
    const { userId, name, age, breed, location, image, gender, description, traits } = req.body;

    // Validate required fields
    if (!name || !age || !breed || !location || !image) {
        return res.status(400).json({ error: 'Missing required fields: name, age, breed, location, image' });
    }

    const client = getSupabaseClient(req);

    try {
        // 1. 先创建 dog 记录
        const { data: dogData, error: dogError } = await client
            .from('dogs')
            .insert([{
                name,
                age,
                breed,
                location,
                image,
                gender: gender || '公',
                description: description || null,
                traits: traits || []
            }])
            .select()
            .single();

        if (dogError) {
            console.error('创建 dog 记录失败:', dogError);
            return res.status(500).json({ error: dogError.message });
        }

        // 2. 创建 submission 记录，关联 dog_id
        const { data, error } = await client
            .from('dog_submissions')
            .insert([{
                user_id: userId,
                dog_id: dogData.id, // 关联 dog_id
                name,
                age,
                breed,
                location,
                image,
                gender: gender || '公',
                description: description || null,
                traits: traits || [],
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('创建 submission 记录失败:', error);
            return res.status(500).json({ error: error.message });
        }

        // 3. 异步生成 AI简历（不阻塞提交响应）
        generatePetBio({
            name,
            breed,
            age,
            gender: gender || '公',
            photoUrl: image,
        }).then(async (result) => {
            try {
                // 创建 pet_agent 记录
                const { data: agent, error: agentError } = await client
                    .from('pet_agents')
                    .insert([{
                        dog_id: dogData.id,
                        generated_bio: result.bio,
                        personality_traits: result.traits,
                        status: 'active',
                        last_active_at: new Date().toISOString(),
                    }])
                    .select()
                    .single();

                if (agentError) {
                    console.error('创建 agent 失败:', agentError);
                    return;
                }

                // 更新 dogs 表的 agent_id
                await client
                    .from('dogs')
                    .update({ agent_id: agent.id })
                    .eq('id', dogData.id);

                console.log(`AI简历已生成: dog_id=${dogData.id}, submission_id=${data.id}`);
            } catch (err) {
                console.error('处理AI简历失败:', err);
            }
        }).catch(err => {
            console.error('调用AI生成失败:', err);
        });

        res.json({ message: 'Dog submission submitted successfully', data });
    } catch (err) {
        console.error('提交失败:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * Get current user's dog submissions
 * Requires authenticateUser() middleware to set req.user
 */
async function getMySubmissions(req, res) {
    const userId = req.user.userId;

    const { data, error } = await supabase
        .from('dog_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
}

/**
 * Get all dog submissions (for admin)
 */
async function getAllSubmissions(req, res) {
    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabase
        .from('dog_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (submissionsError) {
        return res.status(500).json({ error: submissionsError.message });
    }

    // Get user profiles for all unique user_ids
    if (submissions && submissions.length > 0) {
        const userIds = [...new Set(submissions.map(s => s.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

        // Map profiles to submissions
        const profileMap = {};
        if (profiles) {
            profiles.forEach(profile => {
                profileMap[profile.id] = profile;
            });
        }

        // Attach profile info to each submission
        const submissionsWithProfiles = submissions.map(sub => ({
            ...sub,
            profiles: profileMap[sub.user_id] || null
        }));

        return res.json(submissionsWithProfiles);
    }

    res.json(submissions || []);
}

/**
 * Approve dog submission - move to dogs table
 */
async function approveSubmission(req, res) {
    const { id } = req.params;

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
        .from('dog_submissions')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!submission) return res.status(404).json({ error: 'Submission not found or already processed' });

    // 兼容旧数据：如果 dog_id 为 null，先创建 dog
    let dogId = submission.dog_id;
    let dogData;

    if (!dogId) {
        const { data: newDog, error: dogError } = await supabase
            .from('dogs')
            .insert([{
                name: submission.name,
                age: submission.age,
                breed: submission.breed,
                location: submission.location,
                image: submission.image,
                gender: submission.gender,
                description: submission.description,
                traits: submission.traits
            }])
            .select()
            .single();

        if (dogError) {
            console.error('Failed to create dog:', dogError);
            return res.status(500).json({ error: dogError.message });
        }

        // 更新 submission.dog_id
        const { error: linkError } = await supabase
            .from('dog_submissions')
            .update({ dog_id: newDog.id })
            .eq('id', id);

        if (linkError) console.error('Failed to link dog_id:', linkError);

        dogId = newDog.id;
        dogData = newDog;
    } else {
        // 新数据：获取已存在的 dog
        const { data: existingDog, error: dogFetchError } = await supabase
            .from('dogs')
            .select('*')
            .eq('id', dogId)
            .single();

        if (dogFetchError) {
            console.error('Failed to fetch dog:', dogFetchError);
            return res.status(500).json({ error: dogFetchError.message });
        }

        dogData = existingDog;
    }

    // Update submission status and link dog_id
    const { error: updateError } = await supabase
        .from('dog_submissions')
        .update({
            status: 'approved',
            dog_id: dogData.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) {
        console.error('Failed to update submission status:', updateError);
        // Don't fail the request, dog is already added
    }

    // 异步生成 AI简历（不阻塞响应）
    generatePetBio({
        name: submission.name,
        breed: submission.breed,
        age: submission.age,
        gender: submission.gender,
        photoUrl: submission.image,
    }).then(async (result) => {
        try {
            // 检查是否已存在 agent
            const { data: existingAgent } = await supabase
                .from('pet_agents')
                .select('id')
                .eq('dog_id', dogId)
                .single();

            if (existingAgent) {
                // 更新现有 agent
                await supabase
                    .from('pet_agents')
                    .update({
                        generated_bio: result.bio,
                        personality_traits: result.traits,
                        last_active_at: new Date().toISOString(),
                    })
                    .eq('id', existingAgent.id);
            } else {
                // 创建新 agent
                const { data: agent, error: agentError } = await supabase
                    .from('pet_agents')
                    .insert([{
                        dog_id: dogId,
                        generated_bio: result.bio,
                        personality_traits: result.traits,
                        status: 'active',
                        last_active_at: new Date().toISOString(),
                    }])
                    .select()
                    .single();

                if (agentError) {
                    console.error('创建 agent 失败:', agentError);
                    return;
                }

                // 更新 dogs 表的 agent_id
                await supabase
                    .from('dogs')
                    .update({ agent_id: agent.id })
                    .eq('id', dogId);
            }

            console.log(`AI简历已生成: dog_id=${dogId}`);
        } catch (err) {
            console.error('处理AI简历失败:', err);
        }
    }).catch(err => {
        console.error('调用AI生成失败:', err);
    });

    // Send notification to user (optional)
    const { error: messageError } = await supabase
        .from('messages')
        .insert([{
            user_id: submission.user_id,
            sender_name: '系统通知',
            content: `恭喜！您提交的小狗"${submission.name}"已通过审核，现已发布到平台上供其他用户查看。`,
            is_unread: true
        }]);

    if (messageError) console.error('Failed to send notification:', messageError);

    res.json({ message: 'Submission approved and dog added to database', dog: dogData });
}

/**
 * Reject dog submission
 */
async function rejectSubmission(req, res) {
    const { id } = req.params;
    const { reason } = req.body;

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
        .from('dog_submissions')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!submission) return res.status(404).json({ error: 'Submission not found or already processed' });

    // Update submission status
    const { error: updateError } = await supabase
        .from('dog_submissions')
        .update({ 
            status: 'rejected',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Send notification to user
    const { error: messageError } = await supabase
        .from('messages')
        .insert([{
            user_id: submission.user_id,
            sender_name: '系统通知',
            content: `很抱歉，您提交的小狗"${submission.name}"未通过审核。${reason ? `原因：${reason}` : '如有疑问请联系我们。'}`,
            is_unread: true
        }]);

    if (messageError) console.error('Failed to send notification:', messageError);

    res.json({ message: 'Submission rejected' });
}

module.exports = {
    submitDogSubmission,
    getMySubmissions,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission
};
