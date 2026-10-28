# AI Video Editor

Mobile-friendly React + Vite workspace for prompt-based image/video editing. Includes upload and preview, Hindi/English prompts, video-to-animation, clothing, background, style and image-to-video modes, duration/aspect settings, and result preview.

## Run locally

Use Node.js 20 or newer.

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Run `npm run dev`
4. In a second terminal run `npm run server`

The Vite interface runs on port 5173 and proxies `/api` requests to port 3001.

## Real AI generation setup

The interface and server endpoint are implemented, but actual video transformation requires a compatible AI provider and API key. No provider credentials are included. Generation returns a clear setup message until configured.

Set `AI_PROVIDER_URL` and `AI_PROVIDER_KEY` in a private server-side `.env` file. The endpoint must accept multipart/form-data fields: `media` (file), `prompt`, `mode`, `duration` and `aspectRatio`. It must return JSON containing `resultUrl` or `statusUrl`. Many AI services use their own upload/queue/polling formats, so a provider-specific adapter may be required. Never put API keys in frontend code or commit them.

## Scope and limits

- Responsive mobile-first editing workspace.
- Image/video file picker and local preview; 350 MB upload limit on API.
- Prompt templates, mode selection, and result display.
- Provider adapter contract and health endpoint.
- Provider-specific upload/job polling, paid credits, and APK packaging are not included until a provider is selected and configured.
- Test with a configured provider before publishing. A successful frontend build does not prove external AI generation works.
