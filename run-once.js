// run-once.js - GitHub Actions용 1회 실행 스크립트
require("dotenv").config();
const { generateArticle } = require("./generator");
const { publishPost } = require("./publisher");
const { generateImage } = require("./image-generator");
const keywords = require("./keywords");
const fs = require("fs");

const USED_FILE = "./used_keywords.json";

function getUsedKeywords() {
  try {
    return JSON.parse(fs.readFileSync(USED_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveUsedKeyword(keyword) {
  const used = getUsedKeywords();
  used.push(keyword);
  fs.writeFileSync(USED_FILE, JSON.stringify(used));
}

function getNextKeyword() {
  const used = getUsedKeywords();
  const remaining = keywords.filter((k) => !used.includes(k));
  if (remaining.length === 0) {
    fs.writeFileSync(USED_FILE, JSON.stringify([]));
    return keywords[0];
  }
  return remaining[Math.floor(Math.random() * remaining.length)];
}

async function main() {
  console.log("🚀 자동 포스팅 시작:", new Date().toLocaleString());

  const keyword = getNextKeyword();
  console.log("📝 키워드:", keyword);

  try {
    console.log("✍️  글 생성 중...");
    const article = await generateArticle(keyword);
    console.log("✅ 글 생성 완료:", article.title);

    console.log("🎨 대표 이미지 생성 중...");
    const imageResult = await generateImage(keyword, article.title);

    console.log("📤 WordPress 업로드 중...");
    const result = await publishPost(article, keyword, false, imageResult);

    if (result.success) {
      saveUsedKeyword(keyword);
      console.log("✅ 포스팅 완료!");
      console.log("📂 카테고리:", result.category);
      console.log("🔗 URL:", result.url);
      if (result.featuredImage) console.log("🖼️  대표 이미지: 설정 완료");
    } else {
      console.error("❌ 포스팅 실패:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  }
}

main();
