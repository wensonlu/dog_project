const { supabase } = require('../config/supabase');

/**
 * Get all dogs
 */
async function getAllDogs(req, res) {
    const { data, error } = await supabase.from('dogs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}


/**
 * Get specific dog details
 */
async function getDogById(req, res) {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}

module.exports = {
    getAllDogs,
    getDogById
};
