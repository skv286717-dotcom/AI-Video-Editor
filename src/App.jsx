import React, { useEffect, useState } from 'react';

const MODES = [
  {id:'video-animation',icon:'🎭',title:'Video to Animation',desc:'Cartoon, anime ya 3D style'},
  {id:'clothes',icon:'👕',title:'Kapde badlein',desc:'Outfit ka look badlein'},
  {id:'background',icon:'🏞️',title:'Background',desc:'Naya scene ya location'},
  {id:'image-video',icon:'🖼️',title:'Image to Video',desc:'Photo ko motion dein'},
  {id:'face-style',icon:'✨',title:'Look / Style',desc:'Visual style changes'},
  {id:'custom',icon:'✍️',title:'Apna prompt',desc:'Jo chahen likhein'}
];
const EXAMPLES = {
  'video-animation':'Is video ko high-quality 3D cartoon animation mein badlo. Scene, action aur timing ko jitna ho sake same rakho.',
  clothes:'Person ke kapde royal blue sherwani mein badlo. Face, pose, body movement aur background ko same rakho.',
  background:'Background ko sundar Indian wedding venue mein badlo. Person aur movement natural aur same rakho.',
  'image-video':'Is photo ko 5-second cinematic video mein badlo: halki natural movement, soft camera push-in, face aur identity same rahe.',
  'face-style':'Video ko cinematic DSLR look do, natural skin texture rakho aur original identity na badlo.',
  custom:''
};
export default function App(){
  const [file,setFile]=useState(null),[fileUrl,setFileUrl]=useState(''),[mode,setMode]=useState('video-animation');
  const [prompt,setPrompt]=useState(EXAMPLES['video-animation']),[duration,setDuration]=useState('5'),[aspect,setAspect]=useState('9:16');
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[resultUrl,setResultUrl]=useState(''),[resultType,setResultType]=useState('');
  const [error,setError]=useState(''),[apiReady,setApiReady]=useState(false);
  useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(d=>setApiReady(Boolean(d.providerConfigured))).catch(()=>setApiReady(false));},[]);
  useEffect(()=>{if(!file){setFileUrl('');return;}const u=URL.createObjectURL(file);setFileUrl(u);return()=>URL.revokeObjectURL(u);},[file]);
  const isImage=file?.type?.startsWith('image/');
  const chooseFile=p=>{if(!p)return;if(!p.type.startsWith('image/')&&!p.type.startsWith('video/')){setError('Kripya image ya video file select karein.');return;}if(p.size>350*1024*1024){setError('File 350 MB se chhoti honi chahiye.');return;}setFile(p);setResultUrl('');setError('');setStatus('');};
  const runEdit=async()=>{if(!file||!prompt.trim()||busy)return;setBusy(true);setError('');setResultUrl('');setStatus('File upload ho rahi hai…');try{
    const body=new FormData();body.append('media',file);body.append('prompt',prompt.trim());body.append('mode',mode);body.append('duration',duration);body.append('aspectRatio',aspect);
    const response=await fetch('/api/generate',{method:'POST',body});const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Generation request complete nahi ho payi.');
    if(data.resultUrl){setResultUrl(data.resultUrl);setResultType('media');setStatus('AI result ready hai!');}
    else if(data.statusUrl){setResultUrl(data.statusUrl);setResultType('status');setStatus('AI job submit ho gaya.');}
    else setStatus(data.message||'Provider ne result URL return nahi kiya.');
  }catch(e){setError(e.message||'Kuch galat hua. Dobara try karein.');setStatus('');}finally{setBusy(false);}};
  const downloadOriginal=()=>{if(!fileUrl||!file)return;const a=document.createElement('a');a.href=fileUrl;a.download=file.name;a.click();};
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">✦</span><span>AI <b>Video Editor</b><small>CREATE • TRANSFORM • SHARE</small></span></a><span className="top-pill"><span className={apiReady?'dot ready':'dot'}/>{apiReady?'AI provider connected':'AI setup required'}</span></header>
    <section className="hero"><div className="eyebrow">✦ PROMPT-BASED CREATIVE STUDIO</div><h1>Apni video ko <span>naya roop</span> dein.</h1><p>Video, photo, animation, outfit aur background — apna idea Hindi ya English mein likhein.</p></section>
    <div className="workspace"><section className="panel">
      <div className="section-heading"><div><span className="step">01</span><h2>Media upload karein</h2></div><span className="muted">Max 350 MB</span></div>
      <label className="dropzone" htmlFor="media-file">{fileUrl?<div className="preview-wrap">{isImage?<img src={fileUrl} alt="Selected preview"/>:<video src={fileUrl} controls playsInline/>}<span className="file-chip">{isImage?'IMAGE':'VIDEO'} · {(file.size/(1024*1024)).toFixed(1)} MB</span></div>:<><span className="upload-icon">↑</span><strong>Photo ya video choose karein</strong><span>Tap karke gallery / files kholein</span><small>MP4, MOV, WEBM, JPG, PNG, WEBP</small></>}</label>
      <input id="media-file" type="file" accept="video/*,image/*" onChange={e=>chooseFile(e.target.files?.[0])} hidden/>
      {file&&<div className="file-row"><span className="file-name">📎 {file.name}</span><button className="text-button" onClick={()=>{setFile(null);setResultUrl('');}}>Remove</button></div>}
      <div className="section-heading mode-heading"><div><span className="step">02</span><h2>Kya change karna hai?</h2></div></div>
      <div className="mode-grid">{MODES.map(item=><button key={item.id} className={'mode-card '+(mode===item.id?'selected':'')} onClick={()=>setMode(item.id)} type="button" aria-pressed={mode===item.id}><span className="mode-icon">{item.icon}</span><span className="mode-title">{item.title}</span><span className="mode-desc">{item.desc}</span></button>)}</div>
      <div className="section-heading prompt-heading"><div><span className="step">03</span><h2>Apna prompt likhein</h2></div><span className="muted">Hindi supported</span></div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} placeholder="Example: Is video ko cartoon banao aur background shaadi wala kar do..."/>
      <div className="prompt-hint">Tip: ek hi prompt mein saare changes likh sakte hain.</div>
      <div className="settings-row"><label>Video duration<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="5">5 seconds</option><option value="8">8 seconds</option><option value="10">10 seconds</option></select></label><label>Aspect ratio<select value={aspect} onChange={e=>setAspect(e.target.value)}><option value="9:16">9:16 · Reels</option><option value="16:9">16:9 · YouTube</option><option value="1:1">1:1 · Square</option></select></label></div>
      {error&&<div className="alert error" role="alert">⚠️ {error}</div>}{status&&<div className="alert info" role="status">{busy&&<span className="spinner"/>} {status}</div>}
      <button className="generate-button" disabled={!file||!prompt.trim()||busy||!apiReady} onClick={runEdit}>{busy?<><span className="spinner"/> Processing…</>:<>✦ &nbsp; AI se video banayein</>}<span className="button-arrow">→</span></button>
      {!apiReady&&<div className="setup-note"><strong>AI engine abhi connect nahi hai.</strong><p>Generation button tabhi chalega jab server par AI provider ki API URL aur secret key set hogi.</p><a href="https://github.com/skv286717-dotcom/AI-Video-Editor#real-ai-generation-setup" target="_blank" rel="noreferrer">Setup instructions kholein ↗</a></div>}
    </section>
    <aside className="panel result-panel"><div className="section-heading"><div><span className="step">04</span><h2>Result preview</h2></div><span className="muted">Output</span></div>
      {resultUrl&&resultType==='media'?<div className="result-media"><video src={resultUrl} controls playsInline/><a className="download-button" href={resultUrl} target="_blank" rel="noreferrer">↗ Result kholein / save karein</a></div>:resultUrl&&resultType==='status'?<div className="result-empty"><span className="result-spark">↗</span><strong>Generation job submit ho gaya</strong><p>Provider ka job-status link:</p><a href={resultUrl} target="_blank" rel="noreferrer">{resultUrl}</a></div>:<div className="result-empty"><div className="empty-art"><span className="art-square">▶</span><span className="art-spark">✦</span><span className="art-circle"/></div><strong>Aapka result yahan dikhega</strong><p>Media upload karein, changes likhein aur AI generation start karein.</p></div>}
      <div className="result-divider"/><div className="result-tips"><strong>✨ Create karne ke tips</strong><ul><li>Changes clearly likhein.</li><li>Face ya original scene same rakhna ho to prompt mein mention karein.</li><li>Long videos ko short clips mein try karein.</li></ul></div>
      {file&&<button className="secondary-button" onClick={downloadOriginal}>↓ Original file save karein</button>}<div className="privacy-note"><span>🔒</span><span>API key browser mein nahi rakhein. Use server environment variables mein hi set karein.</span></div>
    </aside></div><footer><span>AI Video Editor</span><span>Made for creators · Hindi + English</span></footer>
  </main>;
}