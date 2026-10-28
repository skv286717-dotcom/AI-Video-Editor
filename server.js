import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
const app=express();
const port=Number(process.env.PORT||3001);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:350*1024*1024}});
app.use(cors({origin:process.env.CORS_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,providerConfigured:Boolean(process.env.AI_PROVIDER_URL&&process.env.AI_PROVIDER_KEY)}));
app.post('/api/generate',upload.single('media'),async(req,res)=>{
 try{
  if(!req.file)return res.status(400).json({error:'Pehle photo ya video upload karein.'});
  const {prompt,mode,duration='5',aspectRatio='9:16'}=req.body;
  if(!prompt?.trim())return res.status(400).json({error:'Prompt khaali hai. Changes likhein.'});
  if(!process.env.AI_PROVIDER_URL||!process.env.AI_PROVIDER_KEY)return res.status(503).json({error:'Real AI generation abhi configured nahi hai. README ke AI provider setup ko complete karein.'});
  const form=new FormData();
  form.append('media',new Blob([req.file.buffer],{type:req.file.mimetype||'application/octet-stream'}),req.file.originalname||'upload');
  form.append('prompt',prompt.trim());form.append('mode',String(mode||'custom'));form.append('duration',String(duration));form.append('aspectRatio',String(aspectRatio));
  const pr=await fetch(process.env.AI_PROVIDER_URL,{method:'POST',headers:{Authorization:'Bearer '+process.env.AI_PROVIDER_KEY},body:form});
  const raw=await pr.text();let data;try{data=JSON.parse(raw)}catch{data={message:raw.slice(0,500)}}
  if(!pr.ok)return res.status(502).json({error:data.error||data.message||'AI provider error ('+pr.status+').'});
  const resultUrl=data.resultUrl||data.result_url||data.video_url||data.output?.url;
  const statusUrl=data.statusUrl||data.status_url||data.polling_url;
  if(!resultUrl&&!statusUrl)return res.status(502).json({error:'Provider ne resultUrl ya statusUrl nahi diya. Provider response adapter update karna hoga.'});
  return res.json({resultUrl,statusUrl,message:data.message||'AI job submitted.'});
 }catch(err){console.error('Generation request failed:',err);return res.status(500).json({error:'Server par request fail hui. Server logs check karein.'})}
});
app.listen(port,()=>console.log('AI Video Editor API listening on port '+port));