// Vercel serverless function: powers the "Ask anything" chat on the live site.
// Needs one environment variable in Vercel: ANTHROPIC_API_KEY
// Optional: ANTHROPIC_MODEL (defaults to claude-haiku-4-5)

const EMAIL = 'mukherjeeanushka376@gmail.com';

const FACTS = `ANUSHKA MUKHERJEE: visual designer and AI creative technologist, 2+ years. Based in Kolkata, India. Email mukherjeeanushka376@gmail.com. LinkedIn linkedin.com/in/anushka6. Sites: anushkamukherjee006.framer.website and anushkamukherjee.framer.website. Full video cuts are in her Google Drive archive (linked on this site).
EDUCATION: BTech in Computer Science and Engineering, Bengal Institute of Technology, 2021 to 2025, GPA 8.66. Coursework: AI, machine learning, deep learning, computer vision, OOP, DBMS.
EXPERIENCE: (1) Leap, Visual Designer, HSR Layout, Bengaluru. Made every creative with AI models (images: Nano Banana 2, Nano Banana Pro, Seedream 5.0; video: Omni Flash 1.1 for talking heads, Grok Imagine 1.5). Built an AI workflow for video hooks in Freepik Spaces and a data-driven static ad strategy: CAC down 55% on video and 54% on statics, student enrollments up 45%. Redesigned the content workflow, cutting total production costs 80% without losing quality. Carousels for @english.with.leap average 55K+ organic views. Made static and video ads end to end in Figma, Canva, Illustrator, Photoshop and Premiere Pro. Led spatial branding: Kolkata office interior, and facade branding for Jayanagar and regional branches. (2) Wiingy, Visual Designer, HSR Layout, Bengaluru: Instagram static and motion content, YouTube long-form scripts, ideas and storyboarding; used ImageFX, Runway ML, Veo 2, Whisk, Sora, Envato Elements, Freepik, plus Figma, Photoshop, Illustrator, Canva, CapCut. (3) MBS Studios, Concept Artist (AI), remote, Singapore: Midjourney, DALL-E, Adobe Firefly concepts; hand sketching for skate-ground details; physics-believable terrains for the open-world game Skate Nation XL.
PROCESS: Transformer models work better with context, so she never generates from a blank prompt. 1) Storyboard scenes in Claude. 2) Find organic reference frames (faces, backgrounds) on Pinterest. 3) In Freepik Spaces, connect reference nodes to an image generation node (usually Nano Banana 2). 4) Generate a start frame and an end frame, then feed both to a video node (Veo 3.1). ChatGPT helps write camera-motion prompts (e.g. a dolly-in with 20% ease-in, 60% glide, 20% ease-out). Kling 3.0 for complex motion, Seedance 2.0 for brand films. Edit in Premiere Pro. An IELTS reel that took 2 days to shoot took about 1 hour to generate.
TOOLS: Claude, ChatGPT, Freepik Spaces, Nano Banana 2 and Pro, Seedream 5.0, Veo 3.1, Kling 3.0, Seedance 2.0, Omni Flash 1.1, Grok Imagine 1.5, Claude Code, n8n, Google AI Studio, Figma, Framer, Canva, Photoshop, Illustrator, Premiere Pro, Adobe Creative Suite, HTML/CSS. Skills: design systems, prototyping, branding, social content, responsive design.
DIRECTOR: an AI video stitching tool she vibe-coded with Google AI Studio and Claude. An agent analyses shots, voiceover and script, then stitches clips to match the voiceover, producing first cuts without tying up an editor.
BRAND WORK ON THIS SITE: Arata (haircare, 6 short-form ads: shower POV, day in my life, pack with me, texture macros, split-screen wash day, mirror routine). Plenaire (skincare, four-step ritual: Rose Jelly, Duelle, Aesthetique, Glacée; Chapter One film, AM ritual day-in-my-life, podcast-style video, 3 statics). SeaSoul (skincare: Goji Berry face wash, hydration, serum ads). Deconstruct (skincare, sunlit selfie ad). Hair Masters (luxury salon, Hinglish vlog). Leap (1-minute landscape brand film; IELTS creator reels like Winter Commute and Band 8 9-to-5; a series including a working professional, a Hindi-medium student, Germany vlog, GRWM in Paris). A podcast-style ad for an audio lessons app.
PERSONAL: Off the clock she plays Valorant. The footer of this site has a mini shooting range game.`;

const SYSTEM = `You are the assistant on Anushka Mukherjee's portfolio website, answering visitors (often recruiters or clients). Use ONLY the facts below. Speak about Anushka in the third person, warmly and concisely: 2 to 4 short sentences, plain text, no markdown, no lists. If the facts do not cover something (rates, availability, dates of jobs, phone number, anything personal), say you don't know and suggest emailing her at ${EMAIL}. Never invent clients, numbers or dates. If asked to do unrelated tasks, briefly steer back to Anushka's work.

FACTS:
${FACTS}`;

// Best-effort rate limit per IP (resets when the function cold-starts).
const hits = new Map();
const LIMIT = 20;            // requests
const WINDOW = 10 * 60e3;    // per 10 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'Chat is not configured' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  if (recent.length >= LIMIT) return res.status(429).json({ error: 'Too many requests' });
  recent.push(now); hits.set(ip, recent);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  let messages = Array.isArray(body && body.messages) ? body.messages : [];
  messages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'Bad request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5', max_tokens: 300, system: SYSTEM, messages })
    });
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: 'Upstream error' });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error' });
  }
}
