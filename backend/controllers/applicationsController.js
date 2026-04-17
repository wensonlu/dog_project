const { supabase } = require('../config/supabase');
const { getSupabaseClient } = require('../utils/supabaseClient');
const {
    normalizeRejectReasonCodes,
    buildApplicationTimeline,
    buildRejectionMessage,
} = require('../utils/applicationWorkflow');

async function getApplicationWithDog(client, applicationId) {
    return client
        .from('applications')
        .select('*, dogs(name)')
        .eq('id', applicationId)
        .single();
}

/**
 * Submit adoption application
 */
async function submitApplication(req, res) {
    const { userId, dogId, fullName, phone, address, hasPets, housingType } = req.body;

    // Use getSupabaseClient to get client with proper auth context
    // If using service role key, this bypasses RLS
    // If using anon key, this includes auth token from request header
    const client = getSupabaseClient(req);
    
    const { data, error } = await client
        .from('applications')
        .insert([{
            user_id: userId,
            dog_id: dogId,
            full_name: fullName,
            phone: phone,
            address: address,
            has_pets: hasPets,
            housing_type: housingType,
            status: 'pending',
            reject_reason_codes: [],
            reject_note: null,
            reviewed_at: null,
        }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Application submitted successfully', data });
}

/**
 * Get all applications (for admin)
 */
async function getAllApplications(req, res) {
    const { data, error } = await supabase
        .from('applications')
        .select('*, dogs(name)')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Flatten dog name for easier access
    const formattedData = data.map(app => ({
        ...app,
        dog_name: app.dogs?.name || '未知'
    }));

    res.json(formattedData);
}

/**
 * Get applications for a specific user
 */
async function getUserApplications(req, res) {
    const { userId } = req.params;
    const client = getSupabaseClient(req);
    
    const { data, error } = await client
        .from('applications')
        .select('*, dogs(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}

/**
 * Get application timeline
 */
async function getApplicationTimeline(req, res) {
    const { id } = req.params;
    const client = getSupabaseClient(req);

    const { data: application, error } = await getApplicationWithDog(client, id);

    if (error) {
        const statusCode = error.code === 'PGRST116' ? 404 : 500;
        return res.status(statusCode).json({ error: error.message });
    }

    const isOwner = application.user_id === req.user.userId;
    const isAdmin = (req.user.permissions & 1) > 0;

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: '无权查看该申请时间线' });
    }

    return res.json({
        applicationId: application.id,
        status: application.status,
        dogName: application.dogs?.name || null,
        timeline: buildApplicationTimeline(application),
    });
}

/**
 * Approve application
 */
async function approveApplication(req, res) {
    const { id } = req.params;
    const client = getSupabaseClient(req);

    const { data: application, error: applicationError } = await getApplicationWithDog(client, id);

    if (applicationError) {
        const statusCode = applicationError.code === 'PGRST116' ? 404 : 500;
        return res.status(statusCode).json({ error: applicationError.message });
    }

    // Update application status
    const { error: updateError } = await supabase
        .from('applications')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reject_reason_codes: [],
            reject_note: null,
        })
        .eq('id', id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Send notification message
    const { error: messageError } = await supabase
        .from('messages')
        .insert([{
            user_id: application.user_id,
            sender_name: '系统通知',
            content: `恭喜！您申请领养 ${application.dogs?.name || '狗狗'} 的申请已通过审核。请尽快联系我们安排见面时间。`,
            is_unread: true
        }]);

    if (messageError) console.error('Failed to send notification:', messageError);

    res.json({ message: 'Application approved and notification sent' });
}

/**
 * Reject application
 */
async function rejectApplication(req, res) {
    const { id } = req.params;
    const { rejectReasonCodes, rejectNote } = req.body;
    const client = getSupabaseClient(req);

    const { data: application, error: applicationError } = await getApplicationWithDog(client, id);

    if (applicationError) {
        const statusCode = applicationError.code === 'PGRST116' ? 404 : 500;
        return res.status(statusCode).json({ error: applicationError.message });
    }

    const normalizedReasonCodes = normalizeRejectReasonCodes(rejectReasonCodes);
    const normalizedRejectNote = typeof rejectNote === 'string' && rejectNote.trim() ? rejectNote.trim() : null;

    // Update application status
    const { error: updateError } = await supabase
        .from('applications')
        .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reject_reason_codes: normalizedReasonCodes,
            reject_note: normalizedRejectNote,
        })
        .eq('id', id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Send notification message
    const { error: messageError } = await supabase
        .from('messages')
        .insert([{
            user_id: application.user_id,
            sender_name: '系统通知',
            content: buildRejectionMessage(application.dogs?.name || '狗狗', normalizedReasonCodes, normalizedRejectNote),
            is_unread: true
        }]);

    if (messageError) console.error('Failed to send notification:', messageError);

    res.json({ message: 'Application rejected and notification sent' });
}

module.exports = {
    submitApplication,
    getAllApplications,
    getUserApplications,
    getApplicationTimeline,
    approveApplication,
    rejectApplication
};
