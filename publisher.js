// publisher.js - WordPress XML-RPC 자동 포스팅
const axios = require("axios");
require("dotenv").config();

// 키워드 → 카테고리 자동 분류
const CATEGORY_MAP = {
  "Sleep & Recovery": [
    "sleep", "insomnia", "rest", "fatigue", "tired", "melatonin", "tea for sleep", "better sleep"
  ],
  "Nutrition & Diet": [
    "food", "diet", "vitamin", "mineral", "nutrition", "eat", "meal", "weight loss",
    "superfood", "cholesterol", "blood pressure", "gut", "metabolism", "immune"
  ],
  "Fitness & Exercise": [
    "exercise", "workout", "stretch", "fitness", "belly fat", "muscle", "knee",
    "posture", "back pain", "neck", "shoulder", "lose weight"
  ],
  "Mental Health": [
    "stress", "anxiety", "depression", "mental", "mood", "mindfulness", "meditation", "focus"
  ],
  "Natural Remedies": [
    "remedy", "natural", "herb", "inflammation", "headache", "pain", "home remedy"
  ],
};

function getCategoryName(keyword) {
  const lower = keyword.toLowerCase();
  for (const [category, terms] of Object.entries(CATEGORY_MAP)) {
    if (terms.some((term) => lower.includes(term))) {
      return category;
    }
  }
  return "General Health";
}

function buildXmlRpcRequest(method, params) {
  const encodeValue = (val) => {
    if (typeof val === "string") {
      return `<value><string>${val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</string></value>`;
    }
    if (typeof val === "number") {
      return `<value><int>${val}</int></value>`;
    }
    if (typeof val === "boolean") {
      return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
    }
    if (Array.isArray(val)) {
      const items = val.map((v) => `<value>${encodeValue(v)}</value>`).join("");
      return `<value><array><data>${items}</data></array></value>`;
    }
    if (typeof val === "object") {
      const members = Object.entries(val)
        .map(([k, v]) => `<member><name>${k}</name>${encodeValue(v)}</member>`)
        .join("");
      return `<value><struct>${members}</struct></value>`;
    }
    return `<value><string>${val}</string></value>`;
  };

  const paramXml = params.map((p) => `<param>${encodeValue(p)}</param>`).join("");
  return `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${paramXml}</params></methodCall>`;
}

async function getCategoryId(categoryName) {
  try {
    const xml = buildXmlRpcRequest("wp.getTerms", [
      1,
      process.env.WP_USERNAME,
      process.env.WP_APP_PASSWORD,
      "category",
    ]);

    const response = await axios.post(
      `${process.env.WP_URL}/xmlrpc.php`,
      xml,
      { headers: { "Content-Type": "text/xml" } }
    );

    const matches = [...response.data.matchAll(/<name>([^<]+)<\/name>[\s\S]*?<term_id>(\d+)<\/term_id>/g)];
    for (const match of matches) {
      if (match[1].trim() === categoryName) {
        return parseInt(match[2]);
      }
    }
    return null;
  } catch (error) {
    console.error("카테고리 ID 조회 오류:", error.message);
    return null;
  }
}

async function publishPost(article, keyword = "") {
  try {
    // 카테고리 자동 분류
    const categoryName = getCategoryName(keyword || article.title);
    console.log(`📂 카테고리: ${categoryName}`);

    const categoryId = await getCategoryId(categoryName);

    const postData = {
      post_title: article.title,
      post_content: article.content,
      post_status: "publish",
      post_excerpt: article.meta,
      post_type: "post",
    };

    if (categoryId) {
      postData.terms = { category: [categoryId] };
    }

    const xml = buildXmlRpcRequest("wp.newPost", [
      1,
      process.env.WP_USERNAME,
      process.env.WP_APP_PASSWORD,
      postData,
    ]);

    const response = await axios.post(
      `${process.env.WP_URL}/xmlrpc.php`,
      xml,
      { headers: { "Content-Type": "text/xml" } }
    );

    const postId = response.data.match(/<string>\s*(\d+)\s*<\/string>/)?.[1];
    if (postId) {
      return {
        success: true,
        postId,
        category: categoryName,
        url: `${process.env.WP_URL}/?p=${postId}`,
      };
    } else {
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error("포스팅 오류:", error.message);
    return { success: false, error: error.message };
  }
}

async function testConnection() {
  try {
    const xml = buildXmlRpcRequest("wp.getProfile", [
      1,
      process.env.WP_USERNAME,
      process.env.WP_APP_PASSWORD,
    ]);

    const response = await axios.post(
      `${process.env.WP_URL}/xmlrpc.php`,
      xml,
      { headers: { "Content-Type": "text/xml" } }
    );

    if (response.data.includes("faultCode")) {
      console.error("❌ WordPress 연결 실패:", response.data.match(/<string>(.+?)<\/string>/)?.[1]);
      return false;
    }

    console.log("✅ WordPress 연결 성공!");
    return true;
  } catch (error) {
    console.error("❌ WordPress 연결 실패:", error.message);
    return false;
  }
}

module.exports = { publishPost, testConnection, getCategoryName };
