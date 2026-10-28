import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = Number(process.env.PORT || 3001);
const MAX_RUNWAY_BYTES = 4 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 350 * 1024 * 1024 } });
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const runwayKey = () => process.env.RUNWAYML_API_SECRET || process.env.AI_PROVIDER_KEY;
const runwayHeaders = () => ({
  Authorization: 'Bearer ' + runwayKey(),
  'X-Runway-Version': '2024-11-06',
  'Content-Type': 'application/json'
});

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  providerConfigured: Boolean(runwayKey()),
  provider: runwayKey() ? 'Runway' : null
}));

app.post('/api/generate', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Pehle photo ya video upload karein.' });
    const { prompt, mode, duration = '5', aspectRatio = '9:16' } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt khaali hai. Changes likhein.' });
    if (!runwayKey()) return res.status(503).json({ error: 'Runway AI key abhi set nahi hai. README mein diye gaye setup steps follow karein.' });
    if (req.file.size > MAX_RUNWAY_BYTES) return res.status(413).json({ error: 'Runway direct-data limit ke liye file 4 MB se chhoti honi chahiye. Chhota/compressed clip ya image use karein.' });

    const dataUri = `data:${req.file.mimetype || 'application/octet-stream'};base64,${req.file.buffer.toString('base64')}`;
    const isImage = req.file.mimetype?.startsWith('image/');
    const isImageToVideo = isImage || mode === 'image-video';
    const ratio = ({ '9:16': '720:1280', '16:9': '1280:720', '1:1': '960:960' })[aspectRatio] || '720:1280';
    const seconds = Math.min(10, Math.max(2, Number.parseInt(duration, 10) || 5));
    let endpoint;
    let payload;

    if (isImageToVideo) {
      if (!isImage) return res.status(400).json({ error: 'Image-to-video mode ke liye photo upload karein.' });
      endpoint = 'image_to_video';
      payload = { model: 'gen4.5', promptImage: dataUri, promptText: prompt.trim(), ratio, duration: seconds };
    } else {
      endpoint = 'video_to_video';
      payload = { model: 'aleph2', videoUri: dataUri, promptText: prompt.trim().slice(0, 1000) };
    }

    const created = await fetch(`https://api.dev.runwayml.com/v1/${endpoint}`, {
      method: 'POST',
      headers: runwayHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000)
    });
    const createdText = await created.text();
    let task;
    try { task = JSON.parse(createdText); } catch { task = { message: createdText.slice(0, 500) }; }
    if (!created.ok) {
      const detail = task.error || task.message || task.detail || `Runway API error (${created.status})`;
      return res.status(created.status === 401 || created.status === 403 ? 502 : 502).json({ error: String(detail) });
    }
    if (!task.id) return res.status(502).json({ error: 'Runway ne task ID nahi diya. API response format check karein.' });

    const deadline = Date.now() + 8 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(task.id)}`, {
        headers: { Authorization: 'Bearer ' + runwayKey(), 'X-Runway-Version': '2024-11-06' },
        signal: AbortSignal.timeout(30000)
      });
      const pollText = await poll.text();
      let current;
      try { current = JSON.parse(pollText); } catch { current = {}; }
      if (!poll.ok) return res.status(502).json({ error: current.error || current.message || 'Runway task status check fail hua.' });
      if (current.status === 'SUCCEEDED') {
        const resultUrl = current.output?.[0] || current.output?.url || current.outputUrl;
        if (!resultUrl) return res.status(502).json({ error: 'Runway task complete hua, lekin output URL nahi mila.' });
        return res.json({ resultUrl, message: 'AI video ready hai.' });
      }
      if (current.status === 'FAILED' || current.status === 'CANCELED') {
        return res.status(502).json({ error: current.failure || current.failureCode || 'Runway generation fail ho gayi. Prompt ya media badal kar try karein.' });
      }
    }
    return res.status(504).json({ error: 'AI job abhi chal rahi hai aur wait limit poori hui. Thodi der baad dobara check karein.' });
  } catch (err) {
    console.error('Generation request failed:', err);
    if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return res.status(504).json({ error: 'Runway response mein zyada time laga. Dobara try karein.' });
    return res.status(500).json({ error: 'Server par request fail hui. Server logs check karein.' });
  }
});

app.listen(port, () => console.log('AI Video Editor API listening on port ' + port));
