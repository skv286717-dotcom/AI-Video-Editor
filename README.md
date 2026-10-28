# AI Video Editor

Mobile-friendly React + Vite app for prompt-based video and photo edits in Hindi or English. It includes video-to-animation/restyling, clothing and background edits through video-to-video, image-to-video, duration/aspect settings, upload preview, and result preview.

## Run the app

Requires Node.js 20 or newer.

1. Clone/download this repository and open it in a terminal.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Start the frontend with `npm run dev`.
5. In a second terminal, start the API server with `npm run server`.

The Vite interface uses port 5173 and proxies `/api` requests to the API server on port 3001.

## Connect real AI generation (Runway)

1. Create/sign in to an API account at https://dev.runwayml.com/.
2. Create an API key and make sure the API account has credits. API credits are separate from credits in the regular Runway app.
3. Put the key in the server-side `.env` file as `RUNWAYML_API_SECRET=your_key`. Never paste the key into this chat, commit it to GitHub, or add it to frontend code.
4. Restart `npm run server`. The app header should say `Runway AI connected`.
5. Try a short, compressed MP4 (video-to-video) or a JPG/PNG (image-to-video). The current direct data-URI integration accepts media files up to 3.5 MB and video-to-video source clips up to 30 seconds. Keep clips short for faster processing and lower cost.

The backend calls Runway's official `POST /v1/image_to_video` and `POST /v1/video_to_video` endpoints, then polls the task status until success/failure or a timeout. It returns the generated output URL to the UI. Runway charges API credits per generation; review its current pricing before use.

## Important limits

- Real generation requires a valid Runway API key and API credits; this repository cannot create those for you.
- Current API integration uses base64 data URIs, so keep the uploaded image/video at or below 3.5 MB. Larger-file upload via Runway's separate asset-upload flow is not yet implemented.
- The image-to-video endpoint is for photos; the video-to-video endpoint is for source video edits.
- A successful web build confirms the app compiles, not that a paid external API key works. Test with your own API account before publishing.
