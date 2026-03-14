// index.js - 메인 실행 파일
require("dotenv").config();
const { generateArticle } = require("./generator");
const { publishPost, testConnection } = require("./publisher");
const keywords = require("./keywords");
const cron = require("node-cron");
const fs = require("fs");

// 이미 사용한 키워드 추적
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

async function runPost() {
  console.log("\n🚀 자동 포스팅 시작:", new Date().toLocaleString());

  const keyword = getNextKeyword();
  console.log("📝 키워드:", keyword);

  try {
    console.log("✍️  글 생성 중...");
    const article = await generateArticle(keyword);
    console.log("✅ 글 생성 완료:", article.title);

    console.log("📤 WordPress 업로드 중...");
    const result = await publishPost(article, keyword);

    if (result.success) {
      saveUsedKeyword(keyword);
      console.log("✅ 포스팅 완료!");
      console.log("🔗 URL:", result.url);
    } else {
      console.error("❌ 포스팅 실패:", result.error);
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
  }
}

async function main() {
  console.log("🌟 StayWellGo 자동화 시작!");

  // WordPress 연결 테스트
  const connected = await testConnection();
  if (!connected) {
    console.error("WordPress 연결 실패. .env 파일 확인하세요.");
    process.exit(1);
  }

  const h1 = process.env.POST_HOUR_1 || 8;
  const h2 = process.env.POST_HOUR_2 || 20;

  // 매일 오전 8시 포스팅
  cron.schedule(`0 ${h1} * * *`, runPost);
  // 매일 오후 8시 포스팅
  cron.schedule(`0 ${h2} * * *`, runPost);

  console.log(`⏰ 스케줄: 매일 ${h1}시, ${h2}시 자동 포스팅`);
  console.log("💤 대기 중...\n");

  // 테스트: 지금 바로 1개 포스팅
  if (process.argv[2] === "--test") {
    console.log("🧪 테스트 모드 - 지금 바로 포스팅!");
    await runPost();
  }
}

main();
