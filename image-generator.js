// image-generator.js - Gemini API 이미지 자동 생성
const axios = require('axios');
require('dotenv').config({ override: true });

// 키워드 → 시각적 이미지 프롬프트 매핑
const TOPIC_VISUALS = {
  sleep:        'cozy bedroom with soft warm lighting, white pillows and linen, peaceful sleeping atmosphere, lavender and chamomile on bedside table',
  gut:          'colorful fermented foods: kimchi, yogurt, kefir, sauerkraut and fresh vegetables on a wooden table, natural lighting',
  stress:       'serene person meditating in a sunlit room surrounded by indoor plants, calm and peaceful wellness atmosphere',
  inflammation: 'anti-inflammatory foods: turmeric, ginger, leafy greens, blueberries, salmon arranged on white marble surface',
  immune:       'vibrant immune-boosting foods: citrus fruits, garlic, elderberry, green vegetables on clean white background',
  cholesterol:  'heart-healthy foods: avocado, olive oil, walnuts, berries, salmon beautifully arranged on wooden table',
  'belly fat':  'fresh healthy meal prep with colorful vegetables, lean protein, and whole grains in bright modern kitchen',
  weight:       'balanced nutritious meal bowl with colorful ingredients, fresh and vibrant, bright natural light',
  vitamin:      'colorful array of fresh fruits and vegetables rich in vitamins, bright natural light, white marble surface',
  posture:      'person with perfect posture at ergonomic standing desk in bright modern home office, indoor plants',
  exercise:     'person doing yoga or gentle stretching in bright sunlit room with wooden floors and lush indoor plants',
  back:         'person doing gentle back stretching on a yoga mat in peaceful bright room, natural light',
  neck:         'person doing gentle neck stretching at ergonomic desk, home office, soft natural light',
  anxiety:      'calming wellness scene: herbal tea cup, open journal, candle, indoor plants in cozy peaceful corner',
  metabolism:   'energizing healthy breakfast spread: smoothie bowl, whole grains, tropical fresh fruits, green tea',
  superfood:    'instagram-worthy arrangement of superfoods: berries, matcha powder, chia seeds, hemp on white marble',
  'meal prep':  'organized healthy meal prep: colorful glass containers with balanced meals, fresh ingredients on kitchen counter',
  tea:          'elegant herbal tea setup: glass teapot with herbs, honey jar, dried flowers, soft morning window light',
  'blood pressure': 'heart-healthy lifestyle scene: fresh vegetables, measuring device, peaceful home environment',
  'vitamin d':  'person enjoying sunlight in bright outdoor setting, sunshine through window, wellness and vitality',
  magnesium:    'calming bedtime wellness routine: supplements, chamomile tea, lavender, sleep journal on soft linen',
  cortisol:     'serene stress-relief scene: herbal adaptogens, breathing exercise, calm morning routine setup',
  microbiome:   'diverse colorful probiotic and prebiotic foods on wooden board: yogurt, kefir, vegetables, legumes',
  수면:         'cozy Korean bedroom with soft lighting, white bedding, chamomile tea on bedside table, peaceful atmosphere',
  건강:         'vibrant Korean wellness spread: fresh vegetables, supplements, herbal tea in bright modern kitchen',
  다이어트:     'balanced healthy Korean meal with colorful banchan, vegetables, and lean protein in bright kitchen',
  스트레스:     'calm Korean home wellness scene: herbal tea, journal, candle, indoor plants, peaceful morning light',
  면역:         'vibrant immune-boosting foods with Korean ingredients: red ginseng, mushrooms, citrus in bright setting',
};

function buildImagePrompt(keyword, title) {
  const searchText = (keyword + ' ' + title).toLowerCase();

  for (const [key, visual] of Object.entries(TOPIC_VISUALS)) {
    if (searchText.includes(key.toLowerCase())) {
      return (
        `Photorealistic professional wellness blog photography, ${visual}, ` +
        `vibrant colors, no text overlay, no watermark, no logos, ` +
        `16:9 aspect ratio, professional lifestyle and food photography style, ` +
        `bright natural lighting, clean modern composition, high resolution`
      );
    }
  }

  // 매칭 없으면 제목 기반 범용 프롬프트
  return (
    `Photorealistic professional wellness blog photography for article about "${title}", ` +
    `healthy lifestyle, natural wellness, vibrant fresh colors, no text overlay, no watermark, ` +
    `16:9 aspect ratio, bright natural lighting, clean modern composition, high resolution`
  );
}

async function generateImage(keyword, title) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY 없음 - 이미지 생성 건너뜀');
    return null;
  }

  const prompt = buildImagePrompt(keyword, title);
  console.log(`🎨 Gemini 이미지 생성 중: "${title.substring(0, 50)}..."`);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart) {
      console.log('⚠️  Gemini 이미지 데이터 없음 - 포스팅은 계속 진행');
      return null;
    }

    const mimeType = imagePart.inlineData.mimeType;
    console.log(`✅ 이미지 생성 완료 (${mimeType})`);
    return {
      data: imagePart.inlineData.data, // base64
      mimeType,
    };
  } catch (error) {
    const msg =
      error.response?.data?.error?.message ||
      error.response?.data ||
      error.message;
    console.error(`❌ 이미지 생성 오류 (건너뜀): ${msg}`);
    return null; // 이미지 실패해도 포스팅은 계속
  }
}

module.exports = { generateImage };
