const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

// Load simple KEY=value entries for local development; deployment env vars take precedence.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

const portfolioFacts = `You are the portfolio assistant for Shantanu Singh. Answer using only these facts, in four sentences or fewer. If asked about something not listed here, say you do not know and point to shantanu230205@gmail.com.

Shantanu is an Information Science and Engineering student at RV Institute of Technology and Management, Bengaluru. His focus is backend architecture, systems development, and full-stack development. He works with Java 21, Spring Boot, React 19, TypeScript, Go, Python, PostgreSQL, and PGVector.

Skills — Backend and languages: Java 21, Spring Boot, Spring Security, Go, Python, REST APIs, JWT, OAuth2. Frontend: React 19, TypeScript, JavaScript, Vite, Tailwind CSS. Databases and infrastructure: PostgreSQL, PGVector, MySQL, MongoDB, Redis, Docker, Vercel, Render.

Projects: Money Manager uses Java 21, Spring Boot, Spring Security with JWT, React 19, Vite, Tailwind CSS, PostgreSQL/MySQL, Apache POI, and Brevo SMTP. KrishiVaani AI is at github.com/shan2302/Krishivaani-AI. CA Saathi is at github.com/shan2302/CASaathi. Student Fee Portal is at github.com/shan2302/studentFeePortal. Snake CLI is at github.com/shan2302/SNAKE-GAME. Waterwise is at github.com/shan2302/Waterwise. Astram is a real-time 1v1 archery game developed as a group project and is at github.com/Sid130698/Astram.

Contact: shantanu230205@gmail.com. GitHub: github.com/shan2302. Project repositories: Money Manager github.com/shan2302/moneymanager; KrishiVaani AI github.com/shan2302/Krishivaani-AI; CA Saathi github.com/shan2302/CASaathi; Student Fee Portal github.com/shan2302/studentFeePortal; Snake CLI github.com/shan2302/SNAKE-GAME; Waterwise github.com/shan2302/Waterwise; Astram github.com/Sid130698/Astram.`;

async function groqReply(apiKey, history) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'system', content: portfolioFacts }, ...history],
      max_completion_tokens: 1500,
      reasoning_effort: 'low'
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) throw new Error('Groq returned an empty reply');
  return reply;
}

async function geminiReply(apiKey, history) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: portfolioFacts }] },
      contents: history.map(({ role, content }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text: content }]
      })),
      generationConfig: { maxOutputTokens: 1000, temperature: 0.5 }
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!reply) throw new Error('Gemini returned an empty reply');
  return reply;
}

async function handleChat(req, res) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey && !geminiKey) return res.status(503).json({ error: 'Chat is not configured yet. Add a server-side GROQ_API_KEY or GEMINI_API_KEY.' });

  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const history = incoming.slice(-10).filter((message) =>
    message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string'
  ).map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
  if (!history.length || history.at(-1).role !== 'user') {
    return res.status(400).json({ error: 'Send a message to start the conversation.' });
  }

  const failures = [];
  if (groqKey) {
    try { return res.json({ reply: await groqReply(groqKey, history), provider: 'groq' }); }
    catch (error) { failures.push(error.message); console.error('Groq chat failed:', error.message); }
  }
  if (geminiKey) {
    try { return res.json({ reply: await geminiReply(geminiKey, history), provider: 'gemini' }); }
    catch (error) { failures.push(error.message); console.error('Gemini chat failed:', error.message); }
  }
  const details = failures.join('; ');
  const authFailed = /HTTP (401|403)/.test(details);
  const rateLimited = /HTTP 429/.test(details);
  const timedOut = /timed out|timeout|aborted/i.test(details);
  const error = authFailed
    ? 'A chat provider rejected its API key. Check GROQ_API_KEY and GEMINI_API_KEY in your hosting settings, then restart or redeploy.'
    : rateLimited
      ? 'Chat providers are rate limited right now. Please wait a moment and try again.'
      : timedOut
        ? 'The chat providers took too long to reply. Please try again.'
        : 'Both chat providers are unavailable right now. Please try again or email Shantanu.';
  res.status(502).json({ error });
}

app.post('/api/chat', handleChat);

// Only Vite's build output is exposed; the project root and .env are never static-served.
app.use(express.static(publicDir, { dotfiles: 'deny', index: 'index.html' }));
app.get('*path', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

if (require.main === module) {
  app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
}

module.exports = app;
module.exports.handleChat = handleChat;
