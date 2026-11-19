/* Separate authoring from inspection without restarting jobs or losing selections. */
(()=>{
 const main=document.querySelector('main'),grid=document.querySelector('.studio-grid'),review=document.querySelector('.review-panel');
 const work=el('div',undefined,'workspace-view');work.id='workView';grid.before(work);
 for(const node of [grid,$('planPanel'),$('autoPanel')])work.append(node);
 const detail=el('div',undefined,'detail-view');detail.id='detailView';detail.hidden=true;work.after(detail);
 const nav=el('nav',undefined,'view-tabs');nav.setAttribute('aria-label','工作台页面');
 for(const [id,label]of [['work','操作台'],['detail','波形与迭代详情']]){const b=el('button',label);b.dataset.view=id;b.onclick=()=>show(id);nav.append(b)}
 work.before(nav);
 const summary=el('section',undefined,'panel session-summary');summary.innerHTML='<div><span class="overline">迭代进度</span><h3 id="sessionStatus">尚未启动 RSI</h3><p id="sessionBrief">生成方案后，一键开始审核与修订。</p></div><button id="openDetails" class="primary">查看波形与各轮意见</button>';
 $('autoPanel').append(summary);$('autoPanel').querySelector('.auto-config').after(document.querySelector('.review-models'));$('openDetails').onclick=()=>show('detail');
 const operators=el('section',undefined,'panel operator-overview');operators.innerHTML='<span class="overline">算子更新</span><h2>从参数微调到算子修订</h2><p>审核意见决定下一轮的调整方向。需要修改算法时，生成数值函数的新版本，经过预检查、波形重测与主审后再决定是否复用。</p><div class="operator-flow"><span>审核定位问题</span><span>参数 / 源码微调</span><span>重测与看图</span><span>主审决定复用</span></div><p id="operatorBrief" class="muted">本次更新记录会显示在详情页对应轮次中。</p>';
 work.append(operators);
 const wave=el('section',undefined,'panel detail-wave');wave.innerHTML='<div class="panel-heading"><div><span class="overline">波形观察</span><h2 id="detailTitle">选择一份波形</h2><p id="detailRun" class="muted">可查看当前母本，也可从各轮记录打开生成结果。</p></div><button id="returnWork">返回操作台</button></div><div class="detail-tools"><label>波形<select id="detailMode"><option value="overlay">前后叠加</option><option value="original">原始</option><option value="edited">编辑后</option></select></label><label>导联<select id="detailLead"><option value="all">12 导联</option></select></label><label>时间窗口<select id="detailWindow"><option value="all">完整记录</option><option value="5">5 秒</option><option value="2">2 秒</option><option value="1">1 秒</option></select></label><label>幅度放大<select id="detailGain"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><button id="resetDetail">重置视图</button><div class="legend"><span><i class="gray"></i>原始</span><span><i class="green"></i>编辑后</span></div></div><div class="detail-scrub"><label for="detailStart">起始时间</label><input id="detailStart" type="range" min="0" max="0" step="0.02" value="0"><output id="detailRange">—</output></div><div class="detail-canvas-wrap"><canvas id="detailCanvas" aria-label="可放大的心电图波形"></canvas><div id="detailEmpty">选择母本或打开一轮生成结果后显示波形</div></div><p id="detailCursor" class="muted detail-cursor">移动指针查看时间与幅度 · 横轴 s，纵轴 mV</p>';
 detail.append(wave);for(const lead of ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6']){const o=el('option',lead+' 导联');o.value=lead;$('detailLead').append(o)}
 const rounds=el('section',undefined,'panel rounds-panel');rounds.innerHTML='<div class="panel-heading"><div><span class="overline">迭代记录</span><h2>各轮意见与算子更新</h2><p class="muted">每轮保留方案审核、波形审核、主审方向与源码版本。点击本轮波形可切换上方视图。</p></div></div>';
 rounds.append($('autoTimeline'),$('autoReason'));detail.append(rounds,review);
 const sidebarNav=document.querySelector('.sidebar .nav');sidebarNav.textContent='波形操作台';sidebarNav.onclick=()=>show('work');const sideDetail=el('button','波形与迭代详情','nav');sideDetail.onclick=()=>show('detail');sidebarNav.after(sideDetail);
 document.querySelector('.page-title h1').textContent='心电波形，从需求到迭代';
 document.querySelector('.page-title p').textContent='在操作台生成与修订，在详情页观察波形、查看每轮意见。';
 $('returnWork').onclick=()=>show('work');
 let selected='work',frame=0;
 function show(view,updateHash=true){selected=view==='detail'?'detail':'work';work.hidden=selected!=='work';detail.hidden=selected!=='detail';nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.view===selected);b.setAttribute('aria-current',b.dataset.view===selected?'page':'false')});sidebarNav.classList.toggle('active',selected==='work');sideDetail.classList.toggle('active',selected==='detail');if(updateHash&&location.hash!=='#'+selected)historyReplace(selected);queue();}
 function historyReplace(view){window.history.replaceState(null,'',location.pathname+location.search+'#'+view)}
 function queue(){cancelAnimationFrame(frame);frame=requestAnimationFrame(drawDetail)}
 function openRun(){show('detail');$('detailTitle').textContent='正在载入所选波形…';$('detailEmpty').hidden=false;$('detailEmpty').textContent='正在载入所选波形…';wave.scrollIntoView({behavior:'smooth',block:'start'})}
 window.ECGViews={show,draw:queue,openRun};window.addEventListener('hashchange',()=>show(location.hash==='#detail'?'detail':'work',false));
 for(const id of ['detailMode','detailLead','detailWindow','detailGain','detailStart'])$(id).addEventListener('input',queue);
 $('resetDetail').onclick=()=>{$('detailWindow').value='all';$('detailGain').value='1';$('detailStart').value='0';$('detailLead').value='all';$('detailMode').value='overlay';queue()};
 const canvas=$('detailCanvas');new ResizeObserver(queue).observe(canvas.parentElement);
 let chart=null;
 function drawDetail(){
  if(selected!=='detail')return;
  if(!original){$('detailEmpty').hidden=false;chart=null;return}
  const loading=currentRun&&runData?.report?.id!==currentRun;
  $('detailEmpty').hidden=!loading;
  if(loading){chart=null;return}
  $('detailTitle').textContent=$('waveTitle').textContent;
  $('detailRun').textContent=runData?.report?'版本 '+runData.report.id+' · 母本 '+runData.report.source_id:'当前原始波形 · '+(sourceId||'');
  const duration=original.duration,span=$('detailWindow').value==='all'?duration:Math.min(duration,Number($('detailWindow').value));
  $('detailStart').max=Math.max(0,duration-span);$('detailStart').disabled=span>=duration;const start=Math.min(Number($('detailStart').value),duration-span);$('detailStart').value=start;$('detailRange').textContent=start.toFixed(2)+' – '+(start+span).toFixed(2)+' s';
  const focus=$('detailLead').value,indices=focus==='all'?original.leads.map((_,i)=>i):[original.leads.indexOf(focus)];
  canvas.style.height=focus==='all'?'960px':'420px';const width=canvas.getBoundingClientRect().width,height=focus==='all'?960:420;if(!width)return;
  const dpr=devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,width,height);
  const pad=52,right=14,cw=width-pad-right,rowH=height/indices.length,gain=Number($('detailGain').value),mode=$('detailMode').value;
  let bound=1.5;for(const w of [original,edited])if(w)for(const row of w.signal)for(const v of row)bound=Math.max(bound,Math.abs(v)*1.05);
  const px=(rowH-26)/(bound*2)*gain,step=span<=2?.1:span<=5?.2:1;
  for(const [row,i]of indices.entries()){
   if(i<0)continue;const y0=row*rowH,cy=y0+rowH/2;
   ctx.save();ctx.beginPath();ctx.rect(0,y0,width,rowH);ctx.clip();ctx.fillStyle='#fbfaff';ctx.fillRect(0,y0,width,rowH);
   ctx.font='11px system-ui';ctx.strokeStyle='#e6e3f3';ctx.lineWidth=.6;
   for(let t=Math.ceil(start/step)*step;t<=start+span+.00001;t+=step){const x=pad+(t-start)/span*cw;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+rowH-15);ctx.stroke();if(row===indices.length-1&&Math.round(t/step)%Math.max(1,Math.ceil(45/(cw*step/span)))===0){ctx.fillStyle='#79748d';ctx.fillText(t.toFixed(1),x,y0+rowH-2)}}
   for(let v=-bound/gain;v<=bound/gain;v+=.5){const y=cy-v*px;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(width-right,y);ctx.stroke()}
   ctx.fillStyle='#584578';ctx.fillText(original.leads[i],8,y0+15);ctx.fillStyle='#8b829b';ctx.fillText('0',32,cy+3);
   // Calibration marks use the same amplitude scale as both traces.
   ctx.strokeStyle='#86779f';ctx.beginPath();ctx.moveTo(43,cy);ctx.lineTo(43,cy-px);ctx.stroke();ctx.font='9px system-ui';ctx.fillText('1mV',4,Math.max(y0+28,cy-px+3));
   const trace=(w,color)=>{if(!w)return;ctx.strokeStyle=color;ctx.lineWidth=1.25;ctx.beginPath();let begun=false;for(let k=0;k<w.t.length;k++){const t=w.t[k];if(t<start||t>start+span)continue;const x=pad+(t-start)/span*cw,y=cy-w.signal[k][i]*px;if(!begun){ctx.moveTo(x,y);begun=true}else ctx.lineTo(x,y)}ctx.stroke()};
   if(mode!=='edited')trace(original,'#4087db');if(mode!=='original')trace(edited,'#9358ce');ctx.restore();
  }
  if(mode==='edited'&&!edited){$('detailEmpty').textContent='尚未生成编辑后的波形';$('detailEmpty').hidden=false}
  chart={start,span,pad,cw,rowH,indices};
  $('detailCursor').textContent='移动指针查看时间与幅度 · 当前显示为浏览器预览，精确数值以原始数据及 FeatureDB 重测为准';
 }
 canvas.onpointermove=e=>{if(!chart||!original)return;const r=canvas.getBoundingClientRect(),t=chart.start+Math.max(0,Math.min(1,(e.clientX-r.left-chart.pad)/chart.cw))*chart.span,i=chart.indices[Math.min(chart.indices.length-1,Math.max(0,Math.floor((e.clientY-r.top)/chart.rowH)))];
  const value=w=>{if(!w)return '—';let lo=0,hi=w.t.length-1;while(lo<hi){const m=Math.floor((lo+hi)/2);if(w.t[m]<t)lo=m+1;else hi=m}if(lo>0&&t-w.t[lo-1]<w.t[lo]-t)lo--;return w.signal[lo][i].toFixed(3)+' mV'};
  $('detailCursor').textContent=original.leads[i]+' · '+t.toFixed(3)+' s　原始 '+value(original)+'　编辑后 '+value(edited);
 };
 function updateSummary(){const rounds=$('autoTimeline').querySelectorAll('.auto-round');$('sessionStatus').textContent=$('autoStatus').textContent;$('sessionBrief').textContent=rounds.length?'已有 '+rounds.length+' 轮记录 · 波形、审核意见与修订过程在详情页查看。':'生成方案后，一键开始审核与修订。';const updates=[...rounds].filter(r=>r.textContent.includes('算子源码已修改'));$('operatorBrief').textContent=updates.length?'本次有 '+updates.length+' 轮包含算子源码更新，详情页可查看修改说明与微调试验。':'本次尚无算子源码更新记录；参数调整与源码更新分别保留。'}
 new MutationObserver(updateSummary).observe($('autoTimeline'),{childList:true,subtree:true});new MutationObserver(updateSummary).observe($('autoStatus'),{childList:true});updateSummary();show(location.hash==='#detail'?'detail':'work',false);
})();
