# Shantanu Singh — Portfolio

## Run locally

1. Use Node.js 20.19 or newer.
2. Install dependencies with `npm install`.
3. Add `GROQ_API_KEY` and/or `GEMINI_API_KEY` to `.env` (see `.env.example`). Chat tries Groq first and falls back to Gemini if Groq fails.
4. Run `npm run build`, then `npm start`, and open `http://localhost:3000`.

Vite builds the React app into `dist/`. Express serves only that build directory; secrets in the project root are not served. Chat calls Groq first and uses Gemini 3.8 Flash as a fallback, entirely from the server. Markdown replies are sanitized before rendering.

The React interface uses Framer Motion; its lazily loaded Three.js stage uses React Three Fiber and Drei for the interactive background grid. Run `npm test` for the chat endpoint handler tests.

## Deploy

### Render

Create a Node web service for this repository. Set the build command to `npm install && npm run build`, the start command to `npm start`, and add `GROQ_API_KEY` and `GEMINI_API_KEY` as Render environment variables. Render provides `PORT` automatically. Set both providers if you want automatic fallback.

### Vercel

Import the repository into Vercel and add `GROQ_API_KEY` and `GEMINI_API_KEY` under Project Settings → Environment Variables, then redeploy. `api/chat.js` exposes the protected handler as a Vercel function; both keys remain server-side. If you change environment keys, restart locally or redeploy.

## Images and profile links

The supplied portraits and logo are bundled under `public/img/`. GitHub and LinkedIn point to the profiles supplied by Shantanu; project titles and source links open their respective repositories.

For frontend development, run `npm run dev`. Run `npm start` in a second terminal for the Express API; Vite proxies `/api` to port 3000.
