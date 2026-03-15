// run-once-kr.js - yukisang.pro 한국어 자동 포스팅
require("dotenv").config({ override: true });
const { generateArticleKR } = require("./generator-kr");
const { publishPost } = require("./publisher");
const { generateImage } = require("./image-generator");
const keywordsKR = require("./keywords-kr");
const fs = require("fs");

const USED_FILE = "used_keywords_kr.json";
const GOLDEN_FILE = "golden-keywords-kr.json";

function getUsedKeywords() {
  if (fs.existsSync(USED_FILE)) {
    return JSON.parse(fs.readFileSync(USED_FILE, "utf8"));
  }
  return [];
}

function saveUsedKeyword(keyword) {
  const used = getUsedKeywords();
  used.push(keyword);
  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2));
}

function getNextKeyword() {
  const used = getUsedKeywords();

  // 황금 키워드 파일이 있으면 우선 사용
  let pool = keywordsKR;
  if (fs.existsSync(GOLDEN_FILE)) {
    const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"));
    const goldenList = golden.keywords || [];
    if (goldenList.length > 0) {
      pool = [...goldenList, ...keywordsKR]; // 황금 키워드 앞에 배치
      console.log(`💎 황금 키워드 풀 사용 중 (${goldenList.length}개)`);
    }
  }

  const available = pool.filter((k) => !used.includes(k));
  if (available.length === 0) {
    fs.writeFileSync(USED_FILE, JSON.stringify([], null, 2));
    return pool[0];
  }
  return available[Math.floor(Math.random() * available.length)];
}

async function main() {
  console.log(`🚀 yukisang.pro 한국어 자동 포스팅 시작: ${new Date().toLocaleString()}`);

  const keyword = getNextKeyword();
  console.log(`📝 키워드: ${keyword}`);

  console.log("🔥 글 생성 중...");
  const article = await generateArticleKR(keyword);
  console.log(`✅ 글 생성 완료: ${article.title}`);

  console.log("🎨 대표 이미지 생성 중...");
  const imageResult = await generateImage(keyword, article.title);

  console.log("🌐 WordPress 업로드 중...");
  const result = await publishPost(article, keyword, true, imageResult);

  if (result.success) {
    console.log(`✅ 포스팅 성공! ID: ${result.postId}`);
    console.log(`🔗 URL: ${result.url}`);
    if (result.featuredImage) console.log("🖼️  대표 이미지: 설정 완료");
    saveUsedKeyword(keyword);
  } else {
    console.error(`❌ 포스팅 실패:`, result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
