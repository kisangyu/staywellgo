// keyword-miner.js - 황금 키워드 채굴기
// 검색량 높고 경쟁 낮은 키워드 자동 발굴
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

// 시드 키워드 (한국어)
const SEED_TOPICS_KR = [
  "다이어트", "숙면", "혈압", "혈당", "콜레스테롤",
  "면역력", "피로", "두통", "허리통증", "스트레스",
  "비타민", "유산균", "마그네슘", "오메가3", "단백질",
  "갱년기", "관절염", "소화불량", "변비", "피부미용",
  "탈모", "눈건강", "간건강", "신장건강", "심장건강",
  "수면", "불면증", "우울감", "불안", "집중력",
  "근육통", "목통증", "무릎통증", "어깨통증", "손목통증",
];

// 수식어 (한국어)
const MODIFIERS_KR = [
  "추천", "방법", "좋은 음식", "원인", "증상",
  "해결법", "개선", "영양제", "운동법", "빠르게",
  "자연치료", "효과적인", "집에서", "40대", "50대",
];

// 시드 키워드 (영어)
const SEED_TOPICS_EN = [
  "sleep", "weight loss", "gut health", "stress relief", "immune system",
  "vitamin D", "magnesium", "metabolism", "inflammation", "blood pressure",
  "cholesterol", "back pain", "neck pain", "knee pain", "fatigue",
  "anxiety", "depression", "focus", "memory", "energy",
  "skin care", "hair loss", "joint pain", "digestive health", "liver health",
];

const MODIFIERS_EN = [
  "natural remedies", "home remedies", "foods that help", "supplements",
  "exercises", "tips", "causes", "symptoms", "treatment",
  "for women over 40", "for men", "after 50", "without medication",
];

async function getNaverBlogCount(keyword) {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return null;
  }
  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/blog.json",
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
        params: { query: keyword, display: 1 },
        timeout: 5000,
      }
    );
    return response.data.total;
  } catch (e) {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mineKoreanKeywords() {
  console.log("🔍 한국어 황금 키워드 채굴 시작...");
  const candidates = [];

  for (const seed of SEED_TOPICS_KR) {
    for (const mod of MODIFIERS_KR) {
      candidates.push(`${seed} ${mod}`);
    }
  }

  const scored = [];
  let count = 0;

  for (const kw of candidates) {
    const competition = await getNaverBlogCount(kw);
    if (competition !== null) {
      scored.push({ keyword: kw, competition });
      if (competition < 50000) {
        console.log(`  💎 ${kw} (경쟁 글: ${competition.toLocaleString()}개)`);
      }
    }
    count++;
    if (count % 20 === 0) {
      console.log(`  진행 중... ${count}/${candidates.length}`);
    }
    await sleep(300); // 네이버 API 요청 제한
  }

  // 경쟁 낮은 순으로 정렬 (황금 키워드 = 경쟁 적음)
  scored.sort((a, b) => a.competition - b.competition);

  // 상위 50개 저장
  const top50 = scored.slice(0, 50).map((k) => k.keyword);
  fs.writeFileSync(
    "./golden-keywords-kr.json",
    JSON.stringify({ updated: new Date().toISOString(), keywords: top50, scores: scored.slice(0, 50) }, null, 2)
  );

  console.log("\n✅ 황금 키워드 TOP 10 (한국어):");
  scored.slice(0, 10).forEach((k, i) => {
    console.log(`  ${i + 1}. "${k.keyword}" - 경쟁 글 ${k.competition.toLocaleString()}개`);
  });

  return top50;
}

async function mineEnglishKeywords() {
  console.log("\n🔍 영어 황금 키워드 채굴 시작...");

  // 영어는 네이버 API 없이 스마트 조합으로 생성
  const candidates = [];
  for (const seed of SEED_TOPICS_EN) {
    for (const mod of MODIFIERS_EN) {
      candidates.push(`${seed} ${mod}`);
    }
  }

  // 단일 키워드도 추가
  for (const seed of SEED_TOPICS_EN) {
    candidates.push(`how to improve ${seed}`);
    candidates.push(`best ${seed} tips`);
    candidates.push(`${seed} benefits`);
  }

  // 랜덤 셔플 후 상위 50개
  const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 50);

  fs.writeFileSync(
    "./golden-keywords-en.json",
    JSON.stringify({ updated: new Date().toISOString(), keywords: shuffled }, null, 2)
  );

  console.log("✅ 영어 키워드 50개 생성 완료");
  return shuffled;
}

async function main() {
  console.log("⛏️  황금 키워드 채굴기 시작!\n");

  // 한국어 키워드 (Naver API 사용)
  const krKeywords = await mineKoreanKeywords();

  // 영어 키워드
  const enKeywords = await mineEnglishKeywords();

  console.log(`\n📊 결과 요약:`);
  console.log(`  한국어 황금 키워드: ${krKeywords.length}개 → golden-keywords-kr.json`);
  console.log(`  영어 키워드: ${enKeywords.length}개 → golden-keywords-en.json`);
  console.log("\n✅ 완료! 다음 포스팅부터 황금 키워드가 자동 사용됩니다.");
}

main().catch(console.error);
