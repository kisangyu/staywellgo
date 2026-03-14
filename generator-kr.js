// generator-kr.js - 한국어 블로그 글 생성 (쿠팡 파트너스 연동)
const axios = require("axios");
require("dotenv").config({ override: true });

// 쿠팡 파트너스 ID (나중에 .env에서 불러옴)
const COUPANG_ID = process.env.COUPANG_PARTNER_ID || "";

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
      const coupangBanner = `
<div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
  <p style="font-size: 14px; color: #666;">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
  <a href="https://link.coupang.com/a/${COUPANG_ID}" target="_blank" referrerpolicy="unsafe-url">
    <img src="https://ads-partners.coupang.com/banners/${COUPANG_ID}" alt="쿠팡 추천 제품" style="max-width: 100%; border-radius: 4px;" />
  </a>
</div>`;
      content = content + coupangBanner;
    }

    return { title, meta, content };
  } catch (e) {
    return { title: keyword, meta: "", content: text };
  }
}

module.exports = { generateArticleKR };
