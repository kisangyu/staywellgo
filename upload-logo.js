// upload-logo.js - 로고를 WordPress에 업로드하고 설정
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

function buildXmlRpcRequest(method, params) {
  const encodeValue = (val) => {
    if (typeof val === "string") {
      return `<value><string>${val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</string></value>`;
    }
    if (typeof val === "number") return `<value><int>${val}</int></value>`;
    if (typeof val === "boolean") return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
    if (typeof val === "object" && !Array.isArray(val)) {
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

async function uploadLogo() {
  try {
    const fileContent = fs.readFileSync("./logo.svg");
    const base64Content = fileContent.toString("base64");

    const xml = buildXmlRpcRequest("wp.uploadFile", [
      1,
      process.env.WP_USERNAME,
      process.env.WP_APP_PASSWORD,
      {
        name: "staywellgo-logo.svg",
        type: "image/svg+xml",
        bits: { _type: "base64", _value: base64Content },
        overwrite: true,
      },
    ]);

    const response = await axios.post(
      `${process.env.WP_URL}/xmlrpc.php`,
      xml,
      { headers: { "Content-Type": "text/xml" } }
    );

    const urlMatch = response.data.match(/<url><string>([^<]+)<\/string><\/url>/) ||
                     response.data.match(/<string>(https?:\/\/[^<]+\.svg[^<]*)<\/string>/);

    if (urlMatch) {
      console.log("✅ 로고 업로드 성공!");
      console.log("🔗 로고 URL:", urlMatch[1]);
      console.log("\n👉 다음 단계:");
      console.log("   외모 → 사용자 정의 → 헤더 → 로고 에서 업로드된 로고를 선택하세요.");
    } else {
      console.log("응답:", response.data.substring(0, 500));
    }
  } catch (error) {
    console.error("❌ 업로드 오류:", error.message);
  }
}

uploadLogo();
