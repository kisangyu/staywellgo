// get-refresh-token.js - Blogger OAuth2 Refresh Token 발급기
// 딱 한 번만 실행하면 됩니다!
const http = require("http");
const https = require("https");
const { exec } = require("child_process");
require("dotenv").config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ .env 파일에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET를 설정하세요!");
  process.exit(1);
}
const REDIRECT_URI = "http://localhost:3456";
const SCOPE = "https://www.googleapis.com/auth/blogger";

const authUrl =
  `https://accounts.google.com/o/oauth2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&response_type=code` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n🔑 Blogger Refresh Token 발급기\n");
console.log("📌 브라우저에서 Google 로그인 후 허용 버튼을 눌러주세요...\n");

// 로컬 서버로 redirect 받기
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3456`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("❌ 코드를 받지 못했습니다. 다시 시도하세요.");
    return;
  }

  res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:50px">
    <h2>✅ 인증 완료!</h2>
    <p>터미널로 돌아가서 Refresh Token을 확인하세요.</p>
    </body></html>`);

  // 코드 → 토큰 교환
  const postData = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  }).toString();

  const options = {
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let data = "";
    tokenRes.on("data", (chunk) => (data += chunk));
    tokenRes.on("end", () => {
      const tokens = JSON.parse(data);
      if (tokens.refresh_token) {
        console.log("\n✅ ===== REFRESH TOKEN 발급 성공! =====\n");
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("\n📋 위 값을 GitHub Secrets에 추가하세요!");
        console.log("   GitHub → staywellgo repo → Settings → Secrets → New secret");
        console.log("   이름: GOOGLE_REFRESH_TOKEN");
        console.log(`   값: ${tokens.refresh_token}\n`);
      } else {
        console.error("❌ 오류:", JSON.stringify(tokens, null, 2));
      }
      server.close();
      process.exit(0);
    });
  });

  tokenReq.on("error", (e) => console.error("요청 오류:", e));
  tokenReq.write(postData);
  tokenReq.end();
});

server.listen(3456, () => {
  console.log("🌐 브라우저 자동 열기 중...\n");
  // Windows에서 브라우저 열기
  exec(`start "${authUrl}"`);

  // 자동으로 안 열리면 수동으로 아래 URL 복사해서 브라우저에 붙여넣기
  console.log("브라우저가 자동으로 안 열리면 아래 URL을 직접 복사해서 브라우저에 붙여넣으세요:\n");
  console.log(authUrl);
  console.log("\n");
});
