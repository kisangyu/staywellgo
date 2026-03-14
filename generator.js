// generator.js - Groq API 영어 글 생성 (무료)
const axios = require("axios");
require("dotenv").config({ override: true });

async function generateArticle(keyword) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 2000,
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
  return `Write a detailed, SEO-optimized blog article about: "${keyword}"

Format your response EXACTLY like this:
TITLE: [catchy title here]
META: [155 character meta description]
CONTENT: [full article content in HTML]

Requirements:
- 1500-2000 words
- Use H2 and H3 headings
- Include a FAQ section at the end
- Natural, helpful tone (not AI-sounding)
- Include practical tips readers can use today
- No fluff, only useful information`;
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
