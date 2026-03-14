// setup-pages.js - WordPress 기본 페이지 자동 생성
const axios = require("axios");
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

const PAGES = [
  {
    title: "About",
    slug: "about",
    content: `<h1>About StayWellGo</h1>
<p>Welcome to <strong>StayWellGo</strong> — your trusted source for practical, science-backed health and wellness information.</p>
<p>Our mission is simple: to help you live a healthier, happier life through easy-to-understand articles on nutrition, fitness, sleep, mental health, and natural remedies.</p>
<h2>What We Cover</h2>
<ul>
<li>🥗 <strong>Nutrition & Diet</strong> — Eat smarter, feel better</li>
<li>💪 <strong>Fitness & Exercise</strong> — Move your body, transform your life</li>
<li>😴 <strong>Sleep & Recovery</strong> — Rest is the foundation of health</li>
<li>🧠 <strong>Mental Health</strong> — A healthy mind powers a healthy body</li>
<li>🌿 <strong>Natural Remedies</strong> — Nature's solutions for everyday health</li>
</ul>
<h2>Our Commitment</h2>
<p>All content on StayWellGo is written with care and reviewed for accuracy. We believe everyone deserves access to quality health information — free and easy to understand.</p>
<p><em>Stay well. Go further.</em></p>`
  },
  {
    title: "Contact",
    slug: "contact",
    content: `<h1>Contact Us</h1>
<p>Have a question, suggestion, or just want to say hello? We'd love to hear from you!</p>
<h2>Get In Touch</h2>
<p>📧 <strong>Email:</strong> contact@staywellgo.com</p>
<p>We typically respond within 1-2 business days.</p>
<h2>What You Can Contact Us About</h2>
<ul>
<li>Questions about our health articles</li>
<li>Content suggestions or topic requests</li>
<li>Advertising or partnership inquiries</li>
<li>Reporting inaccurate information</li>
</ul>
<p><em>Please note: We are not medical professionals. For medical advice, always consult a qualified healthcare provider.</em></p>`
  },
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: `<h1>Privacy Policy</h1>
<p><strong>Last updated: March 2026</strong></p>
<p>StayWellGo ("we", "us", or "our") operates the website staywellgo.com. This page informs you of our policies regarding the collection, use, and disclosure of personal data.</p>
<h2>Information We Collect</h2>
<p>We collect several types of information for various purposes to provide and improve our service:</p>
<ul>
<li><strong>Usage Data:</strong> We may collect information on how the website is accessed and used (e.g., pages visited, time spent).</li>
<li><strong>Cookies:</strong> We use cookies to track activity on our website and improve user experience.</li>
</ul>
<h2>Use of Data</h2>
<p>StayWellGo uses the collected data to:</p>
<ul>
<li>Provide and maintain our website</li>
<li>Analyze usage to improve our content</li>
<li>Display relevant advertisements via Google AdSense</li>
</ul>
<h2>Google AdSense & Analytics</h2>
<p>We use Google AdSense to display ads. Google may use cookies to serve ads based on your prior visits to our website. You can opt out at <a href="https://www.google.com/settings/ads">Google Ads Settings</a>.</p>
<h2>Third-Party Links</h2>
<p>Our website may contain links to third-party sites. We have no control over and assume no responsibility for the content or privacy practices of those sites.</p>
<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy, contact us at: contact@staywellgo.com</p>`
  },
  {
    title: "Disclaimer",
    slug: "disclaimer",
    content: `<h1>Medical Disclaimer</h1>
<p><strong>Last updated: March 2026</strong></p>
<p>The information provided on StayWellGo (staywellgo.com) is for <strong>general informational and educational purposes only</strong>.</p>
<h2>Not Medical Advice</h2>
<p>The content on this website is <strong>not intended to be a substitute for professional medical advice, diagnosis, or treatment.</strong> Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
<h2>No Doctor-Patient Relationship</h2>
<p>Reading content on StayWellGo does not create a doctor-patient relationship between you and any contributor to this site.</p>
<h2>Accuracy of Information</h2>
<p>While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind about the completeness, accuracy, or reliability of the information on this website.</p>
<h2>Emergency Situations</h2>
<p>If you think you may have a medical emergency, <strong>call your doctor or emergency services immediately.</strong></p>
<h2>Affiliate Disclaimer</h2>
<p>Some links on this website may be affiliate links. We may earn a small commission at no extra cost to you if you make a purchase through these links.</p>`
  }
];

async function createPage(page) {
  try {
    const xml = buildXmlRpcRequest("wp.newPost", [
      1,
      process.env.WP_USERNAME,
      process.env.WP_APP_PASSWORD,
      {
        post_title: page.title,
        post_content: page.content,
        post_status: "publish",
        post_type: "page",
        post_name: page.slug,
      },
    ]);

    const response = await axios.post(
      `${process.env.WP_URL}/xmlrpc.php`,
      xml,
      { headers: { "Content-Type": "text/xml" } }
    );

    const postId = response.data.match(/<string>\s*(\d+)\s*<\/string>/)?.[1];
    if (postId) {
      console.log(`✅ "${page.title}" 페이지 생성 완료! → ${process.env.WP_URL}/${page.slug}`);
      return true;
    } else {
      console.error(`❌ "${page.title}" 생성 실패:`, response.data.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error(`❌ "${page.title}" 오류:`, error.message);
    return false;
  }
}

async function main() {
  console.log("📄 StayWellGo 기본 페이지 생성 시작!\n");

  for (const page of PAGES) {
    await createPage(page);
  }

  console.log("\n🎉 모든 페이지 생성 완료!");
  console.log("👉 wp-admin → 페이지 에서 확인하세요.");
}

main();
