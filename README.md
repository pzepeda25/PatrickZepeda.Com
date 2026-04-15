<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aa3d0a62-9484-49ec-9704-2a97e4fab1ee

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Chatbot lead capture (Netlify)

Phase 1 adds a floating site assistant that collects qualified leads and stores them in **Netlify Blobs** (store name: `chatbot-leads`) via the function `submit-chatbot-lead`.

### Run the full stack locally (UI + Functions + Blobs)

Use the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

1. `npm install -g netlify-cli` (or use `npx netlify`)
2. From the repo root: `netlify link` (once, to connect this folder to your Netlify site)
3. Run: `netlify dev`

That serves the app and Netlify Functions so `POST /api/submit-chatbot-lead` works. `npm run dev` alone runs Vite only; it proxies `/api/*` to port `8888`, so without Netlify Dev running, chatbot submissions will not succeed locally.

### Where to edit the chatbot

- **Copy, quick actions, and answer options:** [`src/data/chatbot-flow.ts`](src/data/chatbot-flow.ts)  
  Keep option strings aligned with the allowlists in [`netlify/functions/submit-chatbot-lead.js`](netlify/functions/submit-chatbot-lead.js) (`ALLOWED`).

- **UI layout and steps:** [`src/components/chatbot/LeadChatbot.tsx`](src/components/chatbot/LeadChatbot.tsx)

### Where Blob storage happens

- **Helper:** [`netlify/functions/lib/saveLeadToBlobs.js`](netlify/functions/lib/saveLeadToBlobs.js) — `saveLeadToBlobs()` writes JSON under keys like `leads/{timestamp}-{id}.json`.
- **HTTP handler:** [`netlify/functions/submit-chatbot-lead.js`](netlify/functions/submit-chatbot-lead.js) — validates the body, builds the lead record, calls `saveLeadToBlobs()`, then invokes the phase-2 hook.

### Environment variables (Functions runtime)

On **Netlify production**, Blobs are available automatically when the feature is enabled for the site.

For **local Netlify Dev** with Blobs, use a linked site; the CLI provides context. If you need explicit tokens (advanced), see [Netlify Blobs docs](https://docs.netlify.com/blobs/overview/).

- **`NETLIFY_SITE_ID`** / **`NETLIFY_AUTH_TOKEN`** — used by the Blobs helper fallback path when automatic context is unavailable (same pattern as the existing contact form function).

Do **not** put secrets in the frontend; only the Functions read these.

### Phase 2 (n8n webhook — not implemented yet)

After a successful Blob write, [`netlify/functions/lib/phase2-hooks.js`](netlify/functions/lib/phase2-hooks.js) exports `afterLeadSavedToBlobs(lead, { blobKey, provider })`. Implement your n8n `fetch` there (or import a small module), and add something like `N8N_WEBHOOK_URL` in the Netlify UI. The submit handler already awaits this hook so you can add async work without changing the response shape.
