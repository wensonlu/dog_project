const express = require('express');
const router = express.Router();
const { getAllDogs, getDogById } = require('../controllers/dogsController');
const checkSupabase = require('../middleware/supabaseCheck');
const { supabase } = require('../config/supabase');
const { generatePetTalkingLine } = require('../utils/ai');

// Get all dogs
router.get('/', checkSupabase, getAllDogs);

// Get specific dog details
router.get('/:id', checkSupabase, getDogById);

router.post('/:id/talking-line', checkSupabase, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: dog, error } = await supabase
            .from('dogs')
            .select('id, name, breed, age, location')
            .eq('id', id)
            .single();

        if (error || !dog) {
            return res.status(404).json({ error: '未找到该宠物' });
        }

        const generated = await generatePetTalkingLine({
            name: dog.name,
            breed: dog.breed,
            age: dog.age,
            location: dog.location
        });

        const speechText = `${generated.hook} ${generated.mainLine} ${generated.ctaLine}`.trim();

        res.json({
            lineId: `${dog.id}-${Date.now()}`,
            petId: dog.id,
            bubbleText: generated.hook,
            speechText,
            ctaText: generated.ctaLine,
            source: generated.model,
            duration: generated.duration,
        });
    } catch (error) {
        console.error('talking-line error:', error);
        res.status(500).json({ error: '生成会说话文案失败' });
    }
});

router.post('/:id/talking-voice', checkSupabase, async (req, res) => {
    try {
        const { speechText = '', lineId = '' } = req.body || {};
        const normalizedSpeech = String(speechText).trim();

        if (!normalizedSpeech) {
            return res.status(400).json({ error: 'speechText 不能为空' });
        }

        res.json({
            lineId,
            speechText: normalizedSpeech,
            source: 'client-web-speech',
            durationMs: Math.max(3000, normalizedSpeech.length * 95),
        });
    } catch (error) {
        console.error('talking-voice error:', error);
        res.status(500).json({ error: '生成语音失败' });
    }
});

module.exports = router;
