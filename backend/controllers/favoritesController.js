const { getSupabaseClient } = require('../utils/supabaseClient');

/**
 * Get favorites for a user
 */
async function getUserFavorites(req, res) {
    const { userId } = req.params;
    const client = getSupabaseClient(req);
    if (!client) {
        return res.status(500).json({ error: 'Supabase client not initialized. Please check backend environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).' });
    }

    const { data, error } = await client
        .from('favorites')
        .select('dog_id, dogs(*)')
        .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}

/**
 * Toggle favorite (add or remove)
 */
async function toggleFavorite(req, res) {
    const { userId, dogId } = req.body;
    const client = getSupabaseClient(req);
    if (!client) {
        return res.status(500).json({ error: 'Supabase client not initialized. Please check backend environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).' });
    }

    const { data: existing } = await client
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('dog_id', dogId)
        .single();

    if (existing) {
        // Remove favorite
        const { error: deleteError } = await client
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('dog_id', dogId);
        if (deleteError) return res.status(500).json({ error: deleteError.message });

        // Get current favorite_count and decrement
        const { data: dogData } = await client
            .from('dogs')
            .select('favorite_count')
            .eq('id', dogId)
            .single();

        const newCount = Math.max(0, (dogData?.favorite_count || 0) - 1);
        const { error: updateError } = await client
            .from('dogs')
            .update({ favorite_count: newCount })
            .eq('id', dogId);
        if (updateError) return res.status(500).json({ error: updateError.message });

        return res.json({ status: 'removed' });
    } else {
        // Add favorite
        const { error: insertError } = await client
            .from('favorites')
            .insert([{ user_id: userId, dog_id: dogId }]);
        if (insertError) return res.status(500).json({ error: insertError.message });

        // Get current favorite_count and increment
        const { data: dogData } = await client
            .from('dogs')
            .select('favorite_count')
            .eq('id', dogId)
            .single();

        const newCount = (dogData?.favorite_count || 0) + 1;
        const { error: updateError } = await client
            .from('dogs')
            .update({ favorite_count: newCount })
            .eq('id', dogId);
        if (updateError) return res.status(500).json({ error: updateError.message });

        return res.json({ status: 'added' });
    }
}

module.exports = {
    getUserFavorites,
    toggleFavorite
};
