// publisher.js - WordPress XML-RPC 자동 포스팅
const axios = require("axios");
require("dotenv").config();

// 키워드 → 카테고리 자동 분류 (영어)
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

// 키워드 → 카테고리 자동 분류 (한국어 - yukisang.pro)
const CATEGORY_MAP_KR = {
  "건강 & 식단": [
    "혈압", "다이어트", "면역력", "콜레스테롤", "혈당", "장 건강", "빈혈",
    "유산균", "비타민", "오메가3", "마그네슘", "단백질", "멀티비타민", "홍삼",
    "영양제", "식단", "음식", "건강"
  ],
  "생활 꿀팁": [
    "운동", "숙면", "피로", "두통", "목 결림", "허리", "눈 피로", "스트레칭",
    "꿀팁", "방법", "생활"
  ],
  "여행 & 맛집": [
    "맛집", "여행", "제주도", "서울", "국내", "숙소", "코스"
  ],
  "IT & 기기": [
    "이어폰", "스마트워치", "공기청정기", "안마기", "기기", "추천 제품"
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

function getCategoryNameKR(keyword) {
  for (const [category, terms] of Object.entries(CATEGORY_MAP_KR)) {
    if (terms.some((term) => keyword.includes(term))) {
      return category;
    }
  }
  return "생활 꿀팁"; // 기본 카테고리
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

// Application Password 감지 (공백 포함 = REST API, 없으면 XML-RPC)
function isAppPassword() {
  return process.env.WP_APP_PASSWORD && process.env.WP_APP_PASSWORD.includes(" ");
}

async function getCategoryIdREST(categoryName) {
  try {
    const auth = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString("base64");
    const response = await axios.get(
      `${process.env.WP_URL}/wp-json/wp/v2/categories?per_page=100`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const cat = response.data.find(c => c.name === categoryName);
    return cat ? cat.id : null;
  } catch (error) {
    console.error("카테고리 ID 조회 오류:", error.message);
    return null;
  }
}

async function getCategoryIdXMLRPC(categoryName) {
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

    const termBlocks = response.data.split("<struct>");
    for (const block of termBlocks) {
      const nameMatch = block.match(/<name>name<\/name>[\s\S]*?<string>([^<]+)<\/string>/);
      const idMatch = block.match(/<name>term_id<\/name>[\s\S]*?<string>(\d+)<\/string>/);
      if (nameMatch && idMatch && nameMatch[1].trim() === categoryName) {
        return parseInt(idMatch[1]);
      }
    }
    return null;
  } catch (error) {
    console.error("카테고리 ID 조회 오류:", error.message);
    return null;
  }
}

async function publishPostREST(article, keyword = "", isKorean = false) {
  const categoryName = isKorean
    ? getCategoryNameKR(keyword || article.title)
    : getCategoryName(keyword || article.title);
  console.log(`📂 카테고리: ${categoryName}`);
  const categoryId = await getCategoryIdREST(categoryName);

  const auth = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString("base64");
  const response = await axios.post(
    `${process.env.WP_URL}/wp-json/wp/v2/posts`,
    {
      title: article.title,
      content: article.content,
      status: "publish",
      excerpt: article.meta,
      categories: categoryId ? [categoryId] : [],
      meta: {
        _yoast_wpseo_metadesc: article.meta || "",
        _yoast_wpseo_focuskw: keyword || "",
      },
    },
    { headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" } }
  );

  return {
    success: true,
    postId: response.data.id,
    category: categoryName,
    url: response.data.link,
  };
}

async function publishPostXMLRPC(article, keyword = "") {
  const categoryName = getCategoryName(keyword || article.title);
  console.log(`📂 카테고리: ${categoryName}`);
  const categoryId = await getCategoryIdXMLRPC(categoryName);

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
    return { success: true, postId, category: categoryName, url: `${process.env.WP_URL}/?p=${postId}` };
  } else {
    return { success: false, error: response.data };
  }
}

async function publishPost(article, keyword = "", isKorean = false) {
  try {
    if (isAppPassword()) {
      console.log("🔑 REST API 방식으로 포스팅...");
      return await publishPostREST(article, keyword, isKorean);
    } else {
      console.log("🔑 XML-RPC 방식으로 포스팅...");
      return await publishPostXMLRPC(article, keyword);
    }
  } catch (error) {
    console.error("포스팅 오류:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
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
