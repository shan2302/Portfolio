const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.GROQ_API_KEY = 'test-key';
const { handleChat } = require('../server');
const nativeFetch = global.fetch;

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('chat forwards the active model and completion limit to Groq', async () => {
  let upstreamRequest;
  global.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Shantanu builds backend projects.' } }] }) };
  };
  try {
    const response = responseRecorder();
    await handleChat({ body: { messages: [{ role: 'user', content: 'What does he build?' }] } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { reply: 'Shantanu builds backend projects.', provider: 'groq' });
    assert.equal(upstreamRequest.url, 'https://api.groq.com/openai/v1/chat/completions');
    const requestBody = JSON.parse(upstreamRequest.options.body);
    assert.equal(requestBody.model, 'openai/gpt-oss-120b');
    assert.equal(requestBody.max_completion_tokens, 1500);
    assert.equal(requestBody.reasoning_effort, 'low');
    assert.equal(requestBody.messages.at(-1).content, 'What does he build?');
    assert.equal(upstreamRequest.options.headers.Authorization, 'Bearer test-key');
  } finally { global.fetch = nativeFetch; }
});

test('chat rejects requests without a final user message', async () => {
  const response = responseRecorder();
  await handleChat({ body: { messages: [{ role: 'assistant', content: 'Hello' }] } }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /Send a message/);
});

test('chat reports an unconfigured API key without contacting Groq', async () => {
  const savedKey = process.env.GROQ_API_KEY;
  const savedGeminiKey = process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  global.fetch = () => { throw new Error('Groq should not be called without a key'); };
  try {
    const response = responseRecorder();
    await handleChat({ body: { messages: [{ role: 'user', content: 'Hello' }] } }, response);
    assert.equal(response.statusCode, 503);
  } finally {
    process.env.GROQ_API_KEY = savedKey;
    if (savedGeminiKey !== undefined) process.env.GEMINI_API_KEY = savedGeminiKey;
    global.fetch = originalFetch;
  }
});

test('chat falls back to Gemini when Groq returns an error', async () => {
  const savedGroqKey = process.env.GROQ_API_KEY;
  const savedGeminiKey = process.env.GEMINI_API_KEY;
  process.env.GROQ_API_KEY = 'groq-test-key';
  process.env.GEMINI_API_KEY = 'gemini-test-key';
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.includes('groq.com')) return { ok: false, status: 401 };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini fallback reply.' }] } }] }) };
  };
  try {
    const response = responseRecorder();
    await handleChat({ body: { messages: [{ role: 'user', content: 'What does Shantanu build?' }] } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { reply: 'Gemini fallback reply.', provider: 'gemini' });
    assert.equal(requests.length, 2);
    assert.match(requests[1].url, /models\/gemini-3\.8-flash:generateContent/);
    assert.equal(requests[1].options.headers['x-goog-api-key'], 'gemini-test-key');
  } finally {
    process.env.GROQ_API_KEY = savedGroqKey;
    if (savedGeminiKey !== undefined) process.env.GEMINI_API_KEY = savedGeminiKey;
    else delete process.env.GEMINI_API_KEY;
    global.fetch = nativeFetch;
  }
});
