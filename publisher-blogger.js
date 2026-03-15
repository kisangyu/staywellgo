// publisher-blogger.js - Google Blogger API v3 자동 포스팅
const axios = require("axios");
require("dotenv").config();

// 키워드 → 라벨(태그) 자동 분류
const LABEL_MAP = {
  "Sleep & Recovery": [
    "sleep", "insomnia", "rest", "fatigue", "tired", "melatonin", "better sleep"
  ],
  "Nutrition & Diet": [
    "food", "diet", "vitamin", "mineral", "nutrition", "eat", "meal", "weight loss",
    "superfood", "cholesterol", "blood pressure", "gut", "metabolism", "immune"
  ],
  "Fitness & Exercise": [
    "exercise", "workout", "stretch", "fitness", "belly fat", "muscle", "knee",
    "posture", "back pain", "neck", "shoulder"
  ],
  "Mental Health": [
    "stress", "anxiety", "depression", "mental", "mood", "mindfulness", "meditation", "focus"
  ],
  "Natural Remedies": [
    "remedy", "natural", "herb", "inflammation", "headache", "pain"
  ],
};

function getLabels(keyword) {
  const lower = keyword.toLowerCase();
  const labels = ["Health & Wellness"];
  for (const [label, terms] of Object.entries(LABEL_MAP)) {
    if (terms.some((term) => lower.includes(term))) {
      labels.push(label);
      break;
    }
  }
  return labels;
}

// OAuth2 access token 갱신
async function refreshAccessToken() {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: (process.env.GOOGLE_CLIENT_ID || "").trim(),
        client_secret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        refresh_token: (process.env.GOOGLE_REFRESH_TOKEN || "").replace(/\s+/g, ""),
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("❌ OAuth2 토큰 갱신 실패:", error.response?.data || error.message);
    throw error;
  }
}

// Pexels 이미지를 콘텐츠 상단에 삽입 (URL 직접 사용)
function buildContentWithImage(article, keyword, imageResult) {
  let imageHtml = "";

  // Pexels URL이 있으면 직접 삽입
  if (imageResult && imageResult.pexelsUrl) {
    imageHtml = `<div style="text-align:center;margin:0 0 24px 0;">
<img src="${imageResult.pexelsUrl}" alt="${article.title}" style="max-width:100%;height:auto;border-radius:8px;" />
${imageResult.photographer ? `<p style="font-size:11px;color:#999;margin-top:4px;">Photo by <a href="${imageResult.photographerUrl}" target="_blank" rel="nofollow">${imageResult.photographer}</a> on <a href="https://www.pexels.com" target="_blank" rel="nofollow">Pexels</a></p>` : ""}
</div>`;
  }

  return imageHtml + article.content;
}

async function publishToBlogger(article, keyword = "", imageResult = null) {
  const blogId = process.env.BLOGGER_BLOG_ID;
  if (!blogId) throw new Error("BLOGGER_BLOG_ID 환경변수가 설정되지 않았습니다.");

  console.log("🔑 OAuth2 토큰 갱신 중...");
  const accessToken = await refreshAccessToken();

  const labels = getLabels(keyword || article.title);
  console.log(`🏷️  라벨: ${labels.join(", ")}`);

  const content = buildContentWithImage(article, keyword, imageResult);

  const postData = {
    kind: "blogger#post",
    title: article.title,
    content: content,
    labels: labels,
  };

  console.log("📝 Blogger에 포스팅 중...");
  const response = await axios.post(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
    postData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    success: true,
    postId: response.data.id,
    url: response.data.url,
    labels: labels,
  };
}

module.exports = { publishToBlogger };
