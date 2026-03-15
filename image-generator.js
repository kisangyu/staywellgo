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

// 키워드 → Pexels 검색어 매핑
function buildSearchQuery(keyword, title) {
  const text = (keyword + ' ' + title).toLowerCase();
  const map = [
    ['빈혈|anemia|iron deficiency', 'spinach iron rich food red meat'],
    ['sleep|숙면|불면|melatonin', 'peaceful bedroom sleep white pillow'],
    ['gut|장 건강|유산균|probiotic', 'yogurt fermented kimchi healthy gut'],
    ['stress|불안|anxiety|긴장', 'meditation calm herbal tea relax'],
    ['cholesterol|콜레스테롤', 'avocado salmon heart healthy food'],
    ['blood pressure|혈압', 'fresh vegetables salad healthy diet'],
    ['immune|면역력|면역', 'citrus fruit vitamin c immune boost'],
    ['diet|다이어트|weight loss|체중', 'healthy salad meal diet vegetables'],
    ['vitamin|비타민d|비타민', 'colorful fruits vegetables vitamins'],
    ['supplement|영양제|magnesium|마그네슘', 'supplements capsules health vitamins'],
    ['omega|오메가3', 'salmon fish omega healthy food'],
    ['protein|단백질|프로틴', 'chicken egg protein healthy meal'],
    ['홍삼|red ginseng|ginseng', 'korean ginseng tea health'],
    ['exercise|운동|workout|fitness|헬스', 'workout exercise gym fitness'],
    ['yoga|요가|stretch|스트레칭', 'yoga stretching mat exercise'],
    ['back|허리|요통|spine', 'back pain stretching posture'],
    ['neck|목|shoulder|어깨', 'neck shoulder stretching office'],
    ['skin|피부|미백', 'skincare face beauty natural'],
    ['hair|탈모', 'hair care healthy scalp'],
    ['cholesterol|콜레스테롤', 'heart healthy omega food'],
    ['diabetes|혈당|당뇨', 'low sugar healthy food nutrition'],
    ['headache|두통', 'headache stress relief calm'],
    ['eye|눈 피로|시력', 'eye care screen fatigue rest'],
    ['meal prep|식단|recipe', 'meal prep healthy food container'],
    ['air purifier|공기청정기', 'air purifier clean home'],
    ['earphone|이어폰|headphone', 'wireless earphones music'],
    ['smartwatch|스마트워치', 'smartwatch fitness tracker'],
    ['travel|여행|제주|서울', 'travel nature landscape beautiful'],
    ['massage|안마|마사지', 'massage relaxation wellness spa'],
  ];
  for (const [pattern, query] of map) {
    if (new RegExp(pattern, 'i').test(text)) return query;
  }
  return 'healthy food nutrition wellness';
}

async function generateImage(keyword, title) {
  if (!process.env.PEXELS_API_KEY) {
    console.log('⚠️  PEXELS_API_KEY 없음 - 이미지 생성 건너뜀');
    return null;
  }

  const query = buildSearchQuery(keyword, title);
  console.log(`🎨 이미지 검색 중: "${query}"`);

  try {
    // 1. Pexels에서 사진 검색
    const searchRes = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, per_page: 5, orientation: 'landscape' },
      headers: { Authorization: process.env.PEXELS_API_KEY },
      timeout: 30000,
    });

    const photos = searchRes.data?.photos;
    if (!photos?.length) {
      console.log('⚠️  Pexels 검색 결과 없음');
      return null;
    }

    // 랜덤 선택
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const imageUrl = photo.src.large2x || photo.src.large;
    console.log(`📸 사진 다운로드 중: ${photo.photographer}`);

    // 2. 이미지 다운로드
    const imgRes = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    const mimeType = imgRes.headers['content-type']?.split(';')[0] || 'image/jpeg';
    const data = Buffer.from(imgRes.data).toString('base64');
    console.log(`✅ 이미지 준비 완료 (${mimeType})`);
    return {
      data,
      mimeType,
      pexelsUrl: imageUrl,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  } catch (error) {
    console.error(`❌ 이미지 오류 (건너뜀): ${error.message}`);
    return null;
  }
}

module.exports = { generateImage };
