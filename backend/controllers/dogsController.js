const { supabase } = require('../config/supabase');

const STABLE_DOG_IMAGES = [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1568572933382-74d440642117?w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=900&auto=format&fit=crop'
];

const VALID_UNSPLASH_IDS = new Set(
    STABLE_DOG_IMAGES.map((image) => image.match(/photo-([^?]+)/)?.[1]).filter(Boolean)
);

function getFallbackDogImage(dog) {
    const numericId = Number(dog?.id);
    const index = Number.isFinite(numericId) ? numericId : 0;
    return STABLE_DOG_IMAGES[Math.abs(index) % STABLE_DOG_IMAGES.length];
}

function normalizeDogImage(dog) {
    if (!dog) return dog;

    const image = typeof dog.image === 'string' ? dog.image.trim() : '';
    if (!image) {
        return { ...dog, image: getFallbackDogImage(dog) };
    }

    const unsplashId = image.match(/images\.unsplash\.com\/photo-([^?]+)/)?.[1];
    if (unsplashId && !VALID_UNSPLASH_IDS.has(unsplashId)) {
        return { ...dog, image: getFallbackDogImage(dog) };
    }

    return { ...dog, image };
}

/**
 * Get all dogs
 */
async function getAllDogs(req, res) {
    const { data, error } = await supabase.from('dogs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map(normalizeDogImage));
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
    res.json(normalizeDogImage(data));
}

module.exports = {
    getAllDogs,
    getDogById
};
