// generator-kr.js - 한국어 블로그 글 생성 (쿠팡 파트너스 연동)
const axios = require("axios");
require("dotenv").config({ override: true });

// 쿠팡 파트너스 ID (나중에 .env에서 불러옴)
const COUPANG_ID = process.env.COUPANG_PARTNER_ID || "";

// 키워드 → 쿠팡 검색어 매핑
const KEYWORD_PRODUCT_MAP = {
  "혈압 낮추는 음식 추천": "혈압 영양제",
  "다이어트 식단 일주일 계획": "다이어트 식품",
  "면역력 높이는 음식": "면역력 영양제",
  "콜레스테롤 낮추는 방법": "오메가3",
  "공복 혈당 낮추는 식품": "혈당 영양제",
  "장 건강에 좋은 음식": "유산균",
  "빈혈에 좋은 음식 추천": "철분 영양제",
  "집에서 할 수 있는 다이어트 운동": "홈트레이닝 용품",
  "숙면을 위한 꿀팁": "수면 영양제",
  "피로 해소에 좋은 방법": "피로회복 영양제",
  "두통 빨리 낫는 법": "두통약",
  "목 결림 푸는 스트레칭": "목 마사지기",
  "허리 통증 완화 운동": "허리 보호대",
  "눈 피로 풀어주는 방법": "눈 영양제",
  "유산균 추천 제품": "유산균",
  "비타민D 추천 영양제": "비타민D",
  "오메가3 추천 제품": "오메가3",
  "마그네슘 효능과 추천": "마그네슘",
  "단백질 보충제 추천": "단백질 보충제",
  "멀티비타민 추천": "멀티비타민",
  "홍삼 효능과 추천 제품": "홍삼",
  "서울 맛집 추천": "여행 가이드",
  "제주도 여행 코스": "여행 용품",
  "국내 여행지 추천": "캐리어",
  "가성비 숙소 예약 방법": "여행 용품",
  "가성비 무선 이어폰 추천": "무선 이어폰",
  "스마트워치 추천": "스마트워치",
  "공기청정기 추천": "공기청정기",
  "안마기 추천": "안마기",
};

// 키워드에서 쿠팡 검색어 추출
function getProductSearchTerm(keyword) {
  // 매핑 테이블에 있으면 사용
  if (KEYWORD_PRODUCT_MAP[keyword]) {
    return KEYWORD_PRODUCT_MAP[keyword];
  }
  // 없으면 키워드에서 불필요한 단어 제거 후 검색어로 사용
  return keyword
    .replace(/추천$/, "")
    .replace(/방법$/, "")
    .replace(/하는 법$/, "")
    .replace(/꿀팁$/, "")
    .replace(/효능과/, "")
    .trim();
}

// 쿠팡 파트너스 검색 링크 생성
function getCoupangSearchBlock(keyword, partnerId) {
  const searchTerm = getProductSearchTerm(keyword);
  const encoded = encodeURIComponent(searchTerm);
  const searchUrl = `https://www.coupang.com/np/search?q=${encoded}&sorter=scoreDesc`;
  const affiliateUrl = `https://link.coupang.com/a/${partnerId}?redirect=${encodeURIComponent(searchUrl)}`;

  return `
<div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #fff5f5 0%, #fff 100%); border: 1px solid #ffcccc; border-radius: 10px;">
  <p style="font-size: 13px; color: #999; margin: 0 0 10px 0; text-align: center;">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
  <div style="text-align: center;">
    <p style="font-size: 16px; font-weight: bold; color: #333; margin: 0 0 12px 0;">🛒 "${searchTerm}" 관련 추천 제품 보기</p>
    <a href="${affiliateUrl}" target="_blank" referrerpolicy="unsafe-url"
       style="display: inline-block; background: #e8192c; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">
      쿠팡에서 최저가 확인하기 →
    </a>
  </div>
</div>`;
}

async function generateArticleKR(keyword) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: buildPromptKR(keyword),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;
    return parseArticleKR(text, keyword);
  } catch (error) {
    console.error("글 생성 오류:", error.response?.data || error.message);
    throw error;
  }
}

function buildPromptKR(keyword) {
  return `다음 주제로 SEO에 최적화된 한국어 블로그 글을 작성해주세요: "${keyword}"

아래 형식으로 작성하세요:
TITLE: [클릭을 유도하는 제목]
META: [155자 이내의 메타 설명]
CONTENT: [HTML 형식의 본문 내용]

요구사항:
- 1500~2000자 분량
- H2, H3 소제목 사용
- 실용적인 정보와 팁 포함
- 자연스러운 한국어 문체
- 마지막에 자주 묻는 질문(FAQ) 섹션 포함
- 제품 추천이 필요한 경우 "추천 제품" 섹션 추가
- 독자에게 도움이 되는 정보 위주로 작성`;
}

function parseArticleKR(text, keyword) {
  try {
    const title = text.match(/TITLE:\s*(.+)/)?.[1]?.trim() || keyword;
    const meta = text.match(/META:\s*(.+)/)?.[1]?.trim() || "";
    let content = text.match(/CONTENT:\s*([\s\S]+)/)?.[1]?.trim() || text;

    // 쿠팡 파트너스 배너 추가 (COUPANG_ID가 있을 때만)
    if (COUPANG_ID) {
      const coupangBanner = getCoupangSearchBlock(keyword, COUPANG_ID);
      content = content + coupangBanner;
    }

    return { title, meta, content };
  } catch (e) {
    return { title: keyword, meta: "", content: text };
  }
}

module.exports = { generateArticleKR };
