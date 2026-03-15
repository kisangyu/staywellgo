// generator-kr.js - 한국어 블로그 글 생성 (쿠팡 파트너스 연동)
const axios = require("axios");
require("dotenv").config({ override: true });

// 쿠팡 파트너스 ID (나중에 .env에서 불러옴)
const COUPANG_ID = process.env.COUPANG_PARTNER_ID || "";

// 주제 키워드 → 쿠팡 검색어 (부분 매칭, 우선순위 순서)
const TOPIC_PRODUCT_MAP = [
  { topics: ["마그네슘"],                          product: "마그네슘 영양제" },
  { topics: ["오메가3", "오메가-3"],               product: "오메가3" },
  { topics: ["비타민D", "비타민 D"],               product: "비타민D" },
  { topics: ["유산균", "프로바이오틱"],             product: "유산균" },
  { topics: ["홍삼", "인삼"],                       product: "홍삼" },
  { topics: ["멀티비타민", "종합비타민"],           product: "멀티비타민" },
  { topics: ["단백질", "프로틴"],                   product: "단백질 보충제" },
  { topics: ["철분", "빈혈"],                       product: "철분 영양제" },
  { topics: ["혈당", "당뇨"],                       product: "혈당 영양제" },
  { topics: ["혈압"],                               product: "혈압 영양제" },
  { topics: ["콜레스테롤"],                         product: "오메가3" },
  { topics: ["면역력", "면역"],                     product: "면역력 영양제" },
  { topics: ["수면", "숙면", "불면"],               product: "수면 영양제" },
  { topics: ["피로", "무기력", "피곤"],             product: "피로회복 영양제" },
  { topics: ["스트레스", "불안", "긴장"],           product: "스트레스 영양제" },
  { topics: ["다이어트", "체중", "살", "비만"],     product: "다이어트 식품" },
  { topics: ["장 건강", "장건강", "장"],            product: "유산균" },
  { topics: ["두통", "편두통"],                     product: "두통약" },
  { topics: ["눈 피로", "눈", "시력"],              product: "눈 영양제" },
  { topics: ["목 결림", "목", "어깨"],              product: "목 마사지기" },
  { topics: ["허리", "요통", "척추"],               product: "허리 보호대" },
  { topics: ["관절", "무릎", "연골"],               product: "관절 영양제" },
  { topics: ["탈모", "머리카락"],                   product: "탈모 영양제" },
  { topics: ["피부", "미백", "노화"],               product: "피부 영양제" },
  { topics: ["운동", "트레이닝", "헬스"],           product: "홈트레이닝 용품" },
  { topics: ["안마", "마사지"],                     product: "안마기" },
  { topics: ["이어폰", "헤드폰"],                   product: "무선 이어폰" },
  { topics: ["스마트워치", "애플워치"],             product: "스마트워치" },
  { topics: ["공기청정기"],                         product: "공기청정기" },
  { topics: ["여행", "제주", "서울", "맛집"],       product: "여행 용품" },
];

// 키워드 부분 매칭으로 쿠팡 검색어 추출
function getProductSearchTerm(keyword) {
  for (const { topics, product } of TOPIC_PRODUCT_MAP) {
    if (topics.some((topic) => keyword.includes(topic))) {
      return product;
    }
  }
  // 폴백: 조사·동사 제거 후 핵심어만 남기기
  return keyword
    .replace(/추천$/, "").replace(/방법$/, "")
    .replace(/하는 법$/, "").replace(/꿀팁$/, "")
    .replace(/효능과\s*/, "").replace(/에 좋은/, "")
    .replace(/낮추는\s*/, "").replace(/높이는\s*/, "")
    .replace(/해소에 좋은/, "").replace(/풀어주는/, "")
    .replace(/위한/, "").replace(/관련/, "")
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
        max_tokens: 4000,
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
  return `CRITICAL LANGUAGE RULE: Write ONLY in Korean (한국어 only).
FORBIDDEN: Japanese (hiragana あいう, katakana アイウ, kanji), Chinese characters, Russian/Cyrillic (абвгд), Arabic, Thai, or ANY non-Korean script.
ALLOWED: Korean (가나다), numbers (1234), basic punctuation only.
If you accidentally use a foreign word, replace it with Korean immediately.

당신은 yukisang.pro에 글을 쓰는 10년 경력의 한국어 웰니스 블로거입니다. 구글 에드센스 승인 기준과 E-E-A-T를 철저히 준수하여 다음 주제로 블로그 글을 작성하세요: "${keyword}"

⚠️ 절대 금지: 일본어(히라가나, 가타카나), 한자, 러시아어(키릴), 아랍어, 기타 외국어. 오직 한국어만 사용. 예) "ほうれん草" → "시금치", "マグネシウム" → "마그네슘", "Выбор" → "선택"으로 작성.

아래 형식으로 정확히 작성하세요 (설명 없이 바로 시작):
TITLE: [클릭률 높은 SEO 제목 - 숫자 또는 의문형 포함, 30자 이내]
META: [150자 이내의 메타 설명, 주요 키워드 포함]
CONTENT: [아래 요구사항에 맞는 HTML 본문]

본문 요구사항:
- 분량: 2000~2500자
- 언어: 100% 한국어. 일본어, 한자, 외국어 절대 사용 금지
- 구조: 공감형 도입부 → H2/H3 소제목 5~7개 → 결론(CTA) → FAQ
- HTML 태그: <h2>, <h3>, <ul>/<ol>, <strong> 적극 사용
- 문체: 친근하고 대화체, 1인칭 ("저도 처음엔...", "실제로 해봤는데...", "제 경험상...")
- 개인 경험 2~3개를 자연스럽게 녹여서 작성 (예: "저는 예전에 이걸로 고생했는데...", "주변에서도 많이 물어보는 질문이라...")
- 출처/연구 1개 이상 자연스럽게 언급 (예: "2023년 국내 연구에 따르면...", "한국영양학회 가이드라인에서...")
- 글 도입부 직후 아래 면책 조항 div를 반드시 포함:
  <div style="background:#fff8e1;border-left:4px solid #ffc107;padding:12px 16px;margin:20px 0;border-radius:4px;font-size:14px;color:#666;"><strong>주의사항:</strong> 이 글은 정보 제공 목적으로 작성되었으며 의학적 조언이 아닙니다. 건강 관련 결정은 반드시 전문 의료인과 상담하세요.</div>
- AI가 쓴 티 나지 않게: 문장 길이 다양하게, 구어체 표현, 자연스러운 감정 표현 포함
- FAQ 섹션: <h2>자주 묻는 질문</h2> 후 <h3>으로 질문 5~6개 (상세 답변 포함)
- 결론: 독자를 격려하는 2~3문장 마무리`;
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
