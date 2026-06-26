const canvas=document.getElementById('map'), ctx=canvas.getContext('2d');
const q=document.getElementById('q'), result=document.getElementById('result');
let W,H, scale=1, offsetX=0, offsetY=0, selected=null, gps=null;
const bounds=BI_DATA.bounds, features=BI_DATA.features;
const pad=70;
function merc(lon,lat){ const x=(lon-bounds.minLon)/(bounds.maxLon-bounds.minLon); const latRad=lat*Math.PI/180; const minRad=bounds.minLat*Math.PI/180, maxRad=bounds.maxLat*Math.PI/180; const y=(Math.log(Math.tan(Math.PI/4+latRad/2))-Math.log(Math.tan(Math.PI/4+minRad/2)))/(Math.log(Math.tan(Math.PI/4+maxRad/2))-Math.log(Math.tan(Math.PI/4+minRad/2))); return [x,1-y];}
function screen(lon,lat){const [x,y]=merc(lon,lat); const base=Math.min((W-pad*2),(H-pad*2)); return [W/2+(x-.5)*base*scale+offsetX, H/2+(y-.5)*base*scale+offsetY];}
function resize(){W=canvas.width=innerWidth*devicePixelRatio;H=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';draw();}
addEventListener('resize',resize);
function draw(){
 if(!ctx) return;
 ctx.clearRect(0,0,W,H); ctx.lineWidth=Math.max(1,devicePixelRatio);
 ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.fillStyle='rgba(255,255,255,.08)';
 for(const f of features){
   for(const poly of f.polys){
     ctx.beginPath();
     poly.forEach((p,i)=>{const [x,y]=screen(p[0],p[1]); i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
     ctx.closePath(); ctx.fill(); ctx.stroke();
   }
 }
 if(gps){ const [gx,gy]=screen(gps.lon,gps.lat); ctx.beginPath(); ctx.arc(gx,gy,10*devicePixelRatio,0,Math.PI*2); ctx.fillStyle='#58a6ff'; ctx.fill(); ctx.lineWidth=3*devicePixelRatio; ctx.strokeStyle='white'; ctx.stroke();}
 if(selected){
   const [sx,sy]=screen(selected.lon,selected.lat);
   if(gps){ const [gx,gy]=screen(gps.lon,gps.lat); ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(sx,sy); ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2*devicePixelRatio; ctx.stroke();}
   ctx.beginPath(); ctx.arc(sx,sy,13*devicePixelRatio,0,Math.PI*2); ctx.fillStyle='#ff3b30'; ctx.fill(); ctx.lineWidth=4*devicePixelRatio; ctx.strokeStyle='white'; ctx.stroke();
   ctx.font=(18*devicePixelRatio)+'px -apple-system,Arial'; ctx.fillStyle='white'; ctx.fillText(selected.fire, sx+16*devicePixelRatio, sy-12*devicePixelRatio);
 }
}
function findFire(term){term=String(term).trim(); if(!term)return null; return features.find(f=>f.fire===term)||features.find(f=>String(f.fire_num)===term)||features.find(f=>f.fire.startsWith(term));}
function search(){
 const f=findFire(q.value); if(!f){result.style.display='block'; result.innerHTML='<b>No match.</b> Try another fire number.'; return;}
 selected=f; const [sx,sy]=screen(f.lon,f.lat); offsetX += W/2-sx; offsetY += H/2-sy; scale=Math.max(scale,9);
 result.style.display='block';
 const apple=`http://maps.apple.com/?daddr=${f.lat},${f.lon}`;
 const google=`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`;
 result.innerHTML=`<div class="big">Fire ${f.fire}</div><div>Lat ${f.lat}, Lon ${f.lon}</div><div>PID ${f.pid||''} Plat ${f.plat||''} Lot ${f.lot||''}</div><a href="${apple}">Apple Maps</a><a href="${google}">Google Maps</a>`;
 draw();
}
document.getElementById('searchBtn').onclick=search; q.addEventListener('keydown',e=>{if(e.key==='Enter')search()});
document.getElementById('gpsBtn').onclick=()=>navigator.geolocation&&navigator.geolocation.watchPosition(p=>{gps={lat:p.coords.latitude,lon:p.coords.longitude};draw();},err=>alert('GPS unavailable: '+err.message),{enableHighAccuracy:true});
document.getElementById('plus').onclick=()=>{scale*=1.3;draw()}; document.getElementById('minus').onclick=()=>{scale/=1.3;draw()};
let dragging=false,last=null;
canvas.addEventListener('pointerdown',e=>{dragging=true;last=[e.clientX*devicePixelRatio,e.clientY*devicePixelRatio];canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return; const now=[e.clientX*devicePixelRatio,e.clientY*devicePixelRatio]; offsetX+=now[0]-last[0]; offsetY+=now[1]-last[1]; last=now;draw()});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('wheel',e=>{e.preventDefault(); scale*=e.deltaY<0?1.15:.87;draw()},{passive:false});
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
resize();