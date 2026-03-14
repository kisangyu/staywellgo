// create-logo.js - SVG 로고 생성
const fs = require("fs");

const svg = `<svg width="300" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#27AE60;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1A8A45;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 하트+잎 아이콘 -->
  <circle cx="30" cy="30" r="22" fill="url(#grad)"/>
  <text x="30" y="37" font-size="22" text-anchor="middle" fill="white">🌿</text>

  <!-- StayWellGo 텍스트 -->
  <text x="62" y="24" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#27AE60">StayWell</text>
  <text x="62" y="48" font-family="Arial, sans-serif" font-size="16" fill="#555555">Your Guide to Healthy Living</text>
</svg>`;

fs.writeFileSync("./logo.svg", svg);
console.log("✅ logo.svg 생성 완료!");
console.log("📁 위치:", process.cwd() + "\\logo.svg");
