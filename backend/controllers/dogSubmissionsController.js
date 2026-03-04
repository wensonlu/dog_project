const { supabase } = require('../config/supabase');
const { getSupabaseClient } = require('../utils/supabaseClient');

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
    
    const { data, error } = await client
        .from('dog_submissions')
        .insert([{
            user_id: userId,
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

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Dog submission submitted successfully', data });
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

    // Insert into dogs table
    const { data: dogData, error: insertError } = await supabase
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

    if (insertError) return res.status(500).json({ error: insertError.message });

    // Update submission status
    const { error: updateError } = await supabase
        .from('dog_submissions')
        .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) {
        console.error('Failed to update submission status:', updateError);
        // Don't fail the request, dog is already added
    }

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
