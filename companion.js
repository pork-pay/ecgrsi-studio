/* Original SVG companion; status comes from actual jobs and workflow polling. */
(()=>{
const dock=document.createElement('aside');dock.id='ecgCompanion';dock.dataset.state='idle';dock.setAttribute('aria-label','ECG 工作进度');
dock.innerHTML=`<div class="companion-bubble" role="status" aria-live="polite"><div class="companion-caption"><span>小脉 · 工作进度</span><button class="companion-fold" aria-label="收起进度说明" title="收起">−</button></div><strong id="companionTitle">准备好了</strong><p id="companionDetail">生成方案后，我会在这里显示进度。</p><span id="companionTime" aria-hidden="true"></span></div><button class="companion-pet" aria-label="查看当前工作进度" title="点击查看当前步骤"><svg viewBox="0 0 110 120" aria-hidden="true"><defs><linearGradient id="petBody" x1="0" x2="1" y2="1"><stop stop-color="#79aff7"/><stop offset="1" stop-color="#9271df"/></linearGradient><linearGradient id="petGlass" x2="0" y2="1"><stop stop-color="#f6faff"/><stop offset="1" stop-color="#e3dcfa"/></linearGradient></defs><ellipse class="pet-shadow" cx="55" cy="110" rx="29" ry="6" fill="#8070b2" opacity=".17"/><g class="pet-body"><path d="M55 24V13" stroke="#7b69bd" stroke-width="4" stroke-linecap="round"/><circle class="pet-antenna" cx="55" cy="10" r="5" fill="#96cbff" stroke="#fff" stroke-width="2"/><path class="pet-left-arm" d="M24 63Q5 58 14 81" fill="none" stroke="#8e9cde" stroke-width="10" stroke-linecap="round"/><path class="pet-right-arm" d="M86 63Q105 58 97 81" fill="none" stroke="#9d89dc" stroke-width="10" stroke-linecap="round"/><rect x="29" y="89" width="17" height="17" rx="8" fill="#759bde"/><rect x="65" y="89" width="17" height="17" rx="8" fill="#8e79ce"/><rect x="20" y="24" width="70" height="73" rx="29" fill="url(#petBody)" stroke="#fff" stroke-width="2"/><rect x="28" y="37" width="54" height="36" rx="17" fill="url(#petGlass)"/><g class="pet-eyes" fill="#514675"><ellipse cx="43" cy="52" rx="3.5" ry="5"/><ellipse cx="67" cy="52" rx="3.5" ry="5"/></g><path class="pet-mouth" d="M49 62Q55 67 61 62" fill="none" stroke="#73649e" stroke-width="2.5" stroke-linecap="round"/><circle cx="35" cy="61" r="3" fill="#b5caff"/><circle cx="75" cy="61" r="3" fill="#cec0ef"/><path class="pet-pulse" d="M35 83h9l4-6 6 13 5-9 3 2h13" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></g><g class="pet-badge"><circle cx="90" cy="27" r="10" fill="#7363b8" stroke="#fff" stroke-width="2"/><text id="companionBadge" x="90" y="31" text-anchor="middle" fill="white" font-size="13" font-family="sans-serif">·</text></g></svg></button>`;
document.body.append(dock);
const title=document.getElementById('companionTitle'),detail=document.getElementById('companionDetail'),clock=document.getElementById('companionTime'),badge=document.getElementById('companionBadge');
let active=false,stageSince=Date.now(),lastSeen=Date.now(),stageKey='',retryAt=null,target='autoPanel',acceptedRun=null;
const set=(state,label,text,key=state+label,isActive=false,retry=null)=>{if(key!==stageKey){stageSince=Date.now();stageKey=key}lastSeen=Date.now();active=isActive;retryAt=retry;dock.dataset.state=state;if(title.textContent!==label)title.textContent=label;if(detail.textContent!==(text||''))detail.textContent=text||'';badge.textContent=state==='done'?'✓':state==='error'?'!':state==='retry'?'↻':isActive?'··':'·';};
const getRetry=d=>Object.values(d.retry_state||{})[0];
const retryText=r=>`${r.label} · 第 ${r.attempt}/${r.max_attempts} 次尝试`;
window.ECGCompanion={
 manual(value,hint,auto){if(auto)return;target='planPanel';if(value)set('working',hint||'正在处理','任务进行中，请稍等。','manual:'+hint,true);else if(active)set('idle','这一步已结束','结果和下一步操作已经显示在页面上。')},
 ready(){target='autoPanel';set('idle','方案准备好了','点“开始自动 RSI”，我就跟着这份方案工作。')},
 fail(message){set('error','连接或请求有异常',message,'error:'+message,false)},
 workflow(d){acceptedRun=d.status==='accepted'?d.accepted_run:null;target='autoPanel';const r=getRetry(d);if(d.status==='running'){if(r)set('retry',r.status==='waiting'?'连接中断，等待重试':'正在重新连接',retryText(r),d.id+':'+r.label+':'+r.attempt,true,r.status==='waiting'?r.retry_at:null);else set(/审核/.test(d.stage)?'reviewing':'working',d.stage,`第 ${d.rounds.length||1}/${d.config.max_rounds} 轮 · 已用 ${d.api_calls}/${d.config.max_api_calls} 次请求`,d.id+':'+d.rounds.length+':'+d.stage,true)}else set(d.status==='accepted'?'done':d.status==='failed'?'error':'paused',d.status==='accepted'?'本次验收完成':d.status==='limit_reached'?'已到轮数上限':d.status==='failed'?'任务遇到问题':'任务已停止',d.stop_reason||'结果已保留，可查看记录。',d.id+':'+d.status,false)},
 job(j){if(j.id===acceptedRun&&!['queued','running','reviewing'].includes(j.status))return;target='resultBar';const r=getRetry(j);if(r)set('retry',r.status==='waiting'?'等待接口重试':'正在重新连接',retryText(r),j.id+':'+r.label+':'+r.attempt,true,r.status==='waiting'?r.retry_at:null);else if(['queued','running','reviewing'].includes(j.status))set(j.status==='reviewing'?'reviewing':'working',j.status==='reviewing'?'模型正在审核':j.status==='queued'?'任务排队中':'正在编辑波形',j.message,j.id+':'+j.status,true);else set(j.status==='failed'||Object.keys(j.review_errors||{}).length?'error':'idle',Object.keys(j.review_errors||{}).length?'部分审核未完成':j.status==='failed'?'任务未完成':'本轮处理结束',Object.values(j.review_errors||{}).join('；')||j.message,j.id+':'+j.status,false)},
};
const pet=dock.querySelector('.companion-pet'),bubble=dock.querySelector('.companion-bubble');
const positionKey='ecgrsi.companion.position.v1';
let drag=null,suppressClickUntil=0;
pet.title='拖动小脉调整位置；点击查看当前步骤';
pet.setAttribute('aria-label','小脉：可拖动，点击查看进度，方向键移动');
const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
function place(x,y){
 const margin=8,w=pet.offsetWidth,h=pet.offsetHeight;
 x=clamp(x,margin,innerWidth-w-margin);y=clamp(y,margin,innerHeight-h-margin);
 dock.style.left=x+'px';dock.style.top=y+'px';dock.style.right='auto';dock.style.bottom='auto';
 if(!dock.classList.contains('collapsed')){
  const bw=bubble.offsetWidth,bh=bubble.offsetHeight;
  const bx=x-bw-3>=margin?x-bw-3:x+w+3;
  bubble.style.left=(clamp(bx,margin,innerWidth-bw-margin)-x)+'px';
  bubble.style.top=(clamp(y+h-bh-42,margin,innerHeight-bh-margin)-y)+'px';
 }
}
function reposition(){const r=dock.getBoundingClientRect();place(r.left,r.top)}
function remember(){const r=dock.getBoundingClientRect();try{localStorage.setItem(positionKey,JSON.stringify({x:r.left,y:r.top}))}catch{}}
try{const saved=JSON.parse(localStorage.getItem(positionKey));if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))place(saved.x,saved.y);else reposition()}catch{reposition()}
pet.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0)return;
 suppressClickUntil=0;
 const r=dock.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};
 pet.setPointerCapture(e.pointerId);
});
pet.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<6)return;
 drag.moved=true;dock.classList.add('dragging');place(drag.left+dx,drag.top+dy);
});
function endDrag(e){
 if(!drag||drag.id!==e.pointerId)return;
 const moved=drag.moved;drag=null;dock.classList.remove('dragging');
 if(moved){suppressClickUntil=performance.now()+500;remember()}
 if(pet.hasPointerCapture(e.pointerId))pet.releasePointerCapture(e.pointerId);
}
pet.addEventListener('pointerup',endDrag);pet.addEventListener('pointercancel',endDrag);pet.addEventListener('lostpointercapture',endDrag);
pet.addEventListener('dragstart',e=>e.preventDefault());
dock.querySelector('.companion-fold').onclick=()=>{dock.classList.add('collapsed');reposition()};
pet.onclick=e=>{
 if(e.detail!==0&&performance.now()<suppressClickUntil){e.preventDefault();return}
 if(dock.classList.contains('collapsed')){dock.classList.remove('collapsed');reposition()}
 else document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'center'});
};
pet.addEventListener('keydown',e=>{
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;
 e.preventDefault();const r=dock.getBoundingClientRect(),step=e.shiftKey?30:10;place(r.left+delta[0]*step,r.top+delta[1]*step);remember();
});
window.addEventListener('resize',reposition);
new ResizeObserver(reposition).observe(bubble);
setInterval(()=>{const elapsed=Math.floor((Date.now()-stageSince)/1000);clock.textContent=retryAt?`约 ${Math.max(0,Math.ceil(retryAt-Date.now()/1000))} 秒后重试`:active?`当前步骤 ${elapsed} 秒${Date.now()-lastSeen>20000?' · 正在等待状态更新':''}`:''},1000);
})();
