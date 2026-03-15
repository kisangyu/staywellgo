// run-once-blogger.js - staywellgo.blogspot.com 영어 자동 포스팅
require("dotenv").config({ override: true });
const { generateArticle } = require("./generator");
const { publishToBlogger } = require("./publisher-blogger");
const { generateImage } = require("./image-generator");
const keywords = require("./keywords");
const fs = require("fs");

const USED_FILE = "used_keywords_blogger.json";
const GOLDEN_FILE = "golden-keywords-en.json";

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

  // 황금 키워드(영어) 파일이 있으면 우선 사용
  let pool = keywords;
  if (fs.existsSync(GOLDEN_FILE)) {
    try {
      const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"));
      const goldenList = golden.keywords || [];
      if (goldenList.length > 0) {
        pool = [...goldenList, ...keywords];
        console.log(`💎 황금 키워드 풀 사용 중 (${goldenList.length}개)`);
      }
    } catch (e) {
      // golden file parse error → fallback
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
  console.log(`🚀 staywellgo.blogspot.com 영어 자동 포스팅 시작: ${new Date().toLocaleString()}`);

  const keyword = getNextKeyword();
  console.log(`📝 키워드: ${keyword}`);

  console.log("🔥 글 생성 중...");
  const article = await generateArticle(keyword);
  console.log(`✅ 글 생성 완료: ${article.title}`);

  console.log("🎨 이미지 검색 중...");
  const imageResult = await generateImage(keyword, article.title);

  console.log("📤 Blogger 업로드 중...");
  const result = await publishToBlogger(article, keyword, imageResult);

  if (result.success) {
    console.log(`✅ 포스팅 성공! ID: ${result.postId}`);
    console.log(`🔗 URL: ${result.url}`);
    console.log(`🏷️  라벨: ${result.labels.join(", ")}`);
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
