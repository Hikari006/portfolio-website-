# Anushka Mukherjee, portfolio

A static site (`index.html` + `assets/`) with one serverless function (`api/chat.js`) for the chatbot.

## Deploy on Vercel (no coding needed)

1. Create a new repository on GitHub and upload everything in this folder (drag the files into the GitHub upload page, keeping the `assets` and `api` folders).
2. On vercel.com, add a new project and import that repository.
3. Framework preset: **Other**. Leave build and output settings empty. Deploy.
4. Turn on the AI chatbot: in the project's **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` with a key from console.anthropic.com, then redeploy.
   Without the key the chat still works, using built-in answers.
5. Optional: rename the project to choose your `something.vercel.app` address, or add your own domain under **Settings → Domains**.

### Or with the Vercel CLI
```
npm i -g vercel
cd anushka-portfolio
vercel          # preview
vercel --prod   # live
```

## Notes
- Set a monthly spend limit in the Anthropic console, since the chat is public.
- Videos are the opening hooks (10–12 s). Full cuts live in the Drive archive linked on the site.
- The hero artwork is from kusa.pics; check its license before sharing publicly.
