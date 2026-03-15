// generator.js - Groq API 영어 글 생성 (무료)
const axios = require("axios");
require("dotenv").config({ override: true });

async function generateArticle(keyword) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: buildPrompt(keyword),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;
    return parseArticle(text);
  } catch (error) {
    console.error("글 생성 오류:", error.response?.data || error.message);
    throw error;
  }
}

function buildPrompt(keyword) {
  return `You are a 10-year veteran wellness blogger writing for staywellgo.com. Write a detailed, E-E-A-T compliant, AdSense-safe blog article about: "${keyword}"

Format your response EXACTLY like this (no extra commentary):
TITLE: [catchy SEO title - include number or question, 50-60 chars]
META: [compelling meta description, exactly 150-155 characters, include primary keyword]
CONTENT: [full article in HTML - see requirements below]

CONTENT REQUIREMENTS:
- 1400-1800 words total
- Structure: intro paragraph (hook + empathy + value promise), then H2/H3 sections, then conclusion with CTA, then FAQ
- Use <h2> and <h3> tags, <ul>/<ol> lists, <strong> for key points
- Tone: warm, conversational, first-person ("I've tried this myself...", "When I first started...", "In my experience...")
- Include 2-3 personal experience anecdotes naturally (e.g. "I struggled with this for months until...")
- Include 1 source/study mention naturally (e.g. "According to a 2023 study in the Journal of Nutrition...")
- Include this medical disclaimer as a styled div near the top after intro:
  <div style="background:#fff8e1;border-left:4px solid #ffc107;padding:12px 16px;margin:20px 0;border-radius:4px;font-size:14px;color:#666;"><strong>Disclaimer:</strong> This article is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional before making changes to your diet, exercise, or supplement routine.</div>
- Include 2 Amazon affiliate product recommendation boxes using EXACTLY this HTML structure (fill in realistic product details relevant to the topic):
  <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:20px;margin:24px 0;">
  <h3 style="margin-top:0;color:#333;">Recommended: [Product Name]</h3>
  <p>[2-sentence description of why this product helps with the topic]</p>
  <ul><li>[Feature 1]</li><li>[Feature 2]</li><li>[Feature 3]</li></ul>
  <a href="https://www.amazon.com/s?k=[url-encoded-product-name]&tag=kisangyu-20" target="_blank" rel="nofollow sponsored" style="display:inline-block;background:#FF9900;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">Check on Amazon →</a>
  <p style="font-size:12px;color:#999;margin-bottom:0;">Affiliate disclosure: We may earn a small commission if you purchase through this link, at no extra cost to you.</p>
  </div>
- FAQ section at the end with 5-6 questions and detailed answers (use <h2>Frequently Asked Questions</h2> then <h3> for each Q)
- End with a motivating 2-3 sentence conclusion paragraph before FAQ
- DO NOT make it sound like AI wrote it — vary sentence length, use contractions, include realistic personal details`;
}

function parseArticle(text) {
  try {
    const title = text.match(/TITLE:\s*(.+)/)?.[1]?.trim() || "Health Tips";
    const meta = text.match(/META:\s*(.+)/)?.[1]?.trim() || "";
    const content = text.match(/CONTENT:\s*([\s\S]+)/)?.[1]?.trim() || text;
    return { title, meta, content };
  } catch (e) {
    return { title: "Health Tips", meta: "", content: text };
  }
}

module.exports = { generateArticle };
