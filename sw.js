/* NeuroSoma service worker */
const V='ns-v5';
const ASSETS=["./", "audio/calma_1.mp3", "css/app.css", "fonts/Montserrat-Bold.woff2", "fonts/Montserrat-Light.woff2", "fonts/Montserrat-Medium.woff2", "fonts/Montserrat-Regular.woff2", "fonts/Montserrat-SemiBold.woff2", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "img/logo.png", "img/recurso_1.png", "img/recurso_2.png", "img/recurso_3.png", "js/app.js", "js/code.js", "js/config.js", "js/data.js", "js/icons.js", "manifest.webmanifest", "recursos/kit_1.png", "recursos/kit_1_t.jpg", "recursos/kit_2.png", "recursos/kit_2_t.jpg", "recursos/kit_3.png", "recursos/kit_3_t.jpg", "recursos/kit_4.png", "recursos/kit_4_t.jpg", "recursos/kit_5.png", "recursos/kit_5_t.jpg", "recursos/kit_6.png", "recursos/kit_6_t.jpg"];
async function clean(res){if(!res||!res.redirected)return res;const b=await res.blob();return new Response(b,{status:200,statusText:'OK',headers:res.headers});}
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(ASSETS.map(a=>fetch(new Request(a,{cache:'reload'})).then(clean).then(r=>r&&r.ok&&c.put(a,r)).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting();});
async function ranged(req,res){
  const h=req.headers.get('range'); if(!h||res.status!==200)return res;
  const b=await res.arrayBuffer(); const m=/bytes=(\d*)-(\d*)/.exec(h); let s=+m[1]||0, e=m[2]?+m[2]:b.byteLength-1;
  if(!m[1]&&m[2]){s=b.byteLength-(+m[2]);e=b.byteLength-1}
  return new Response(b.slice(s,e+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':res.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+s+'-'+e+'/'+b.byteLength,'Content-Length':e-s+1}});
}
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return; const u=new URL(r.url); if(u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    let hit=r.mode==='navigate'?await c.match('./'):await c.match(r,{ignoreSearch:true});
    if(hit)return ranged(r,await clean(hit));
    try{const net=await clean(await fetch(r)); if(net.ok&&!r.headers.get('range'))c.put(r,net.clone()); return net;}catch(x){return new Response('Sin conexión',{status:503});}
  })());
});
