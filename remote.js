(()=>{
let endpoint='',token='';
const gate=document.getElementById('remoteGate'),form=document.getElementById('remoteConnect'),error=document.getElementById('remoteError');
for(const child of document.body.children)if(child!==gate&&child.tagName!=='SCRIPT')child.inert=true;
window.ECGRemote={fetch(path,options={}){
 if(!path.startsWith('/api/')&&path!=='/api')throw Error('Invalid API path');
 const headers=new Headers(options.headers||{});headers.set('Authorization','Bearer '+token);
 return fetch(endpoint+path,{...options,headers,credentials:'omit',redirect:'error'});
}};
fetch('./config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{document.getElementById('remoteEndpoint').value=c.backend_url||localStorage.getItem('ecgrsi.endpoint')||''}).catch(()=>{});
const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s)});
form.onsubmit=async e=>{
 e.preventDefault();const button=form.querySelector('button');button.disabled=true;error.textContent='正在连接…';
 try{
  const url=new URL(document.getElementById('remoteEndpoint').value.trim());
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('请输入 HTTPS 服务地址，不要附带路径、密码或参数。');
  endpoint=url.origin;token=document.getElementById('remotePassword').value.trim();
  const response=await window.ECGRemote.fetch('/api/health',{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(response.status===401?'访问密码不正确。':'后端暂不可用（'+response.status+'）。');
  const h=await response.json();if(!h.featuredb)throw Error('Mac 后端的 FeatureDB 尚未就绪。');
  localStorage.setItem('ecgrsi.endpoint',endpoint);document.getElementById('remotePassword').value='';
  await loadScript('./companion.js');await loadScript('./app.js?v=views1');await loadScript('./views.js?v=views1');
  gate.hidden=true;for(const child of document.body.children)child.inert=false;
 }catch(e){token='';error.textContent=e.message==='Failed to fetch'?'连接失败：请确认 Mac 在线、隧道已启用、地址正确。':e.message;button.disabled=false}
};
document.addEventListener('click',async e=>{
 const link=e.target.closest('a');const path=link?.getAttribute('href');if(!path?.startsWith('/api/'))return;
 e.preventDefault();
 try{
  const response=await window.ECGRemote.fetch(path);if(!response.ok)throw Error('下载失败（'+response.status+'）');
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=link.download||path.split('/').pop();a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(err){alert(err.message)}
});
})();
