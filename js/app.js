// 界面与交互：选单元、生成、检查答案、打印
const $=id=>document.getElementById(id),N=['一','二','三','四','五','六'];
$('g').innerHTML=N.map((c,i)=>`<option value="${i+1}">${c}年级</option>`).join('');
function units(){const g=+$('g').value,t=+$('t').value;$('u').innerHTML=T.map((u,i)=>u.g==g&&u.t==t?`<label><input type="checkbox" value="${i}" checked> ${u.n}</label>`:'').join('')}
units();
let QS=[], effectTimer;
function clearFeedback() {
 clearTimeout(effectTimer);
 $('effects').replaceChildren();
 $('feedback').hidden=true;
 $('feedback').replaceChildren();
}
function showFeedback(correct, answered, override) {
 clearFeedback();
 const feedback=override||getFeedback(correct,QS.length,answered), card=$('feedback');
 card.className='feedback '+feedback.kind;
 card.innerHTML=`<span class="feedback-emoji" aria-hidden="true">${feedback.emoji}</span><div><h2>${feedback.title}</h2><p class="feedback-score">答对 ${correct} / ${QS.length} 题 · 正确率 ${Math.round(correct/QS.length*100)}%</p><p>${feedback.message}</p></div>`;
 card.hidden=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if (!reduced && ['confetti','applause'].includes(feedback.kind)) {
  const symbols=feedback.kind==='confetti'?['🌸','✨','🎊','⭐']:['👏','⭐','✨'];
  for(let i=0;i<28;i++) {
   const particle=document.createElement('span');
   particle.textContent=symbols[i%symbols.length];
   particle.style.cssText=`left:${Math.random()*96}%;--drift:${Math.random()*120-60}px;--turn:${Math.random()*360-180}deg;animation-delay:${Math.random()*.7}s;font-size:${18+Math.random()*14}px`;
   $('effects').appendChild(particle);
  }
  effectTimer=setTimeout(()=>$('effects').replaceChildren(),4000);
 }
 card.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest'});
}
$('go').onclick=()=>{
 const us=[...document.querySelectorAll('#u input:checked')].map(i=>T[i.value]);
 if(!us.length){alert('请至少选择一个单元。');return}
 const n=+$('n').value;
 clearFeedback();
 QS=buildPractice(us,n,$('repeat').value==='yes');
 $('status').textContent=QS.length<n
   ?`已生成 ${QS.length} / ${n} 题。当前范围在本次尝试中未能生成足量不同题目，可扩大范围或选择“允许重复”。`
   :`已生成 ${QS.length} 题。`;
 renderSheet();
};
function renderSheet() {
 const g=+$('g').value,t=+$('t').value,c=mode==='adventure'?'2':$('cols').value;
 $('sheet').className=mode==='adventure'?'s1':$('sp').value;
 $('sheet').innerHTML=`<div class="hd"><b>人教版${N[g-1]}年级${t==1?'上':'下'}册 计算练习</b><span>姓名：________　日期：________　用时：______　得分：______</span></div>
 <div class="g${c==3?' c3':''}" style="--c:${c}">`+QS.map((q,i)=>`<div class="p"><span class="n">${i+1}.</span><span>${q[2]=='='?q[0]:'求 x：'+q[0]+'，'}</span><span>${q[2]}</span><input aria-label="第${i+1}题答案" ${/^\d+(\.\d+)?$/.test(q[1])?'inputmode="decimal"':''} autocomplete="off"><span class="m"></span></div>`).join('')+`</div>
 <div class="ans"><b>参考答案</b><div class="g c3" style="--c:3">`+QS.map((q,i)=>`<span>${i+1}. ${q[1]}</span>`).join('')+`</div></div>`;
 if(mode==='adventure') {
  const check=document.createElement('button');
  check.className='pri adventure-submit';
  check.textContent='✨ 完成啦，检查并领取勋章';
  check.onclick=()=>$('chk').onclick();
  $('sheet').appendChild(check);
 }
 $('sheet').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
$('chk').onclick=()=>{
 if(!QS.length)return;
 let correct=0,answered=0;
 document.querySelectorAll('#sheet .p').forEach((p,i)=>{
  const value=p.querySelector('input').value,filled=value.trim()!=='';
  const right=filled&&answerMatches(value,QS[i][1]);
  if(filled)answered++;
  if(right)correct++;
  p.className='p '+(right?'ok':filled?'bad':'');
  p.querySelector('.m').textContent=right?'✓':filled?'✗ 再算一次':'待作答';
 });
 document.querySelector('.hd span').innerHTML=`得分：<b>${correct}</b> / ${QS.length}`;
 if(mode==='adventure'&&activeLevel)finishLevel(correct,answered);
 else showFeedback(correct,answered);
};
$('pa').onchange=e=>document.body.classList.toggle('pa',e.target.checked);
$('pr').onclick=()=>{if(!QS.length){alert('请先生成题目。');return}window.print()};
$('th').onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme=='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=d?'light':'dark'};

let currentCertificate=null;
const SAVE_KEY='pep-calc-adventure-v1';
let mode='practice',activeLevel=null,progress={},storageAvailable=true;
try {progress=readAdventureProgress(localStorage.getItem(SAVE_KEY))}catch {storageAvailable=false}
const routeKey=()=>`${$('g').value}-${$('t').value}`;
function routeStars(){return progress[routeKey()]||ADVENTURE_LEVELS.map(()=>0)}
function renderMap() {
 const stars=routeStars(),completed=stars.filter(Boolean).length;
 $('adventure-progress').textContent=`${N[+$('g').value-1]}年级${$('t').value==='1'?'上':'下'}册 · 已通关 ${completed} / 6 · 星星 ${stars.reduce((a,b)=>a+b,0)} / 18`;
 $('trail-fill').style.width=`${completed/6*100}%`;
 $('level-map').innerHTML=ADVENTURE_LEVELS.map((level,i)=>{
  const locked=i>0&&!stars[i-1],needed=Math.ceil(level.count*level.target);
  return `<button class="level-card ${stars[i]?'completed':locked?'locked':'unlocked'}" data-level="${i}" ${locked?'disabled':''}><span class="level-icon" aria-hidden="true">${locked?'🔒':level.icon}</span><span class="level-number">第 ${i+1} 关</span><strong>${level.name}</strong><span>${level.count} 题 · 答对 ${needed} 题通关</span><span class="level-stars" aria-label="${stars[i]}颗星">${'★'.repeat(stars[i])}${'☆'.repeat(3-stars[i])}</span><span>${stars[i]?'再挑战，收集三星':locked?'完成上一关解锁':'出发探险 →'}</span></button>`;
 }).join('');
 $('badge-shelf').innerHTML=ADVENTURE_LEVELS.map((level,i)=>`<div class="badge ${stars[i]?'earned':''}"><span aria-hidden="true">${stars[i]?level.icon:'🔒'}</span><strong>${level.badge}</strong><small>${stars[i]?'已获得':'通关第'+(i+1)+'关获得'}</small></div>`).join('');
 updateCertificateAvailability();
 $('save-note').textContent=storageAvailable?'进度保存在当前浏览器，各年级、学期分别记录。清除浏览器数据会丢失收藏。':'当前浏览器无法保存进度，本次打开期间仍可继续闯关。';
}
function clearSheet() {
 closeCertificate();
 activeLevel=null;QS=[];clearFeedback();$('sheet').replaceChildren();$('status').textContent='';$('mission').hidden=true;
}
function setMode(next) {
 mode=next;clearSheet();
 document.body.classList.toggle('adventure-mode',mode==='adventure');
 $('adventure').hidden=mode!=='adventure';
 $('practice-mode').className=mode==='practice'?'pri':'';
 $('adventure-mode').className=mode==='adventure'?'pri':'';
 $('practice-mode').setAttribute('aria-pressed',String(mode==='practice'));
 $('adventure-mode').setAttribute('aria-pressed',String(mode==='adventure'));
 // 冒险中不展示参考答案。
 $('pa').checked=false;document.body.classList.remove('pa');
 renderMap();
}
function startLevel(index) {
 const stars=routeStars();
 if(!Number.isInteger(index)||!ADVENTURE_LEVELS[index]||(index>0&&!stars[index-1]))return;
 clearFeedback();
 const level=ADVENTURE_LEVELS[index],pool=adventureUnits(T.filter(u=>u.g===+$('g').value&&u.t===+$('t').value),level);
 QS=buildPractice(pool,level.count,true);
 activeLevel={index,key:routeKey()};
 $('mission').hidden=false;
 $('mission').innerHTML=`<span class="mission-icon" aria-hidden="true">${level.icon}</span><div><h2>第 ${index+1} 关 · ${level.name}</h2><p>${level.story}</p><p>挑战目标：完成 ${level.count} 题，答对至少 ${Math.ceil(level.count*level.target)} 题。允许改正后再次检查。</p><p class="hint">本关本领：${pool.map(u=>u.n).join('、')}</p></div>`;
 $('status').textContent='准备好就开始吧！完成后点击“检查答案”。';
 renderSheet();
}
function finishLevel(correct,answered) {
 const level=ADVENTURE_LEVELS[activeLevel.index],result=adventureResult(level,correct,QS.length,answered);
 if(result.passed) {
  const stars=routeStars(),first=!stars[activeLevel.index];
  stars[activeLevel.index]=Math.max(stars[activeLevel.index],result.stars);
  progress[activeLevel.key]=stars;
  try {localStorage.setItem(SAVE_KEY,JSON.stringify(progress));storageAvailable=true}catch {storageAvailable=false}
  renderMap();
  showFeedback(correct,answered,{kind:'confetti',emoji:level.icon,title:first?`闯关成功！获得「${level.badge}」勋章！`:'再次通关，真棒！',message:`本次点亮 ${result.stars} 颗星！${activeLevel.index===5?'六枚勋章集齐啦！你就是星辰小勇者，也可以重玩关卡收集更多星星。':'下一站的冒险已经解锁，小狐狸等你一起出发！'}`});
  const action=document.createElement('button');
  action.className='pri adventure-next';
  action.textContent=activeLevel.index===5?'🗺️ 回到地图，查看收藏':'下一关 →';
  const nextIndex=activeLevel.index+1;
  action.onclick=()=>{if(nextIndex<ADVENTURE_LEVELS.length)startLevel(nextIndex);else {$('adventure').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}};
  $('feedback').appendChild(action);
 } else {
  const remaining=QS.length-answered,needed=Math.ceil(QS.length*level.target)-correct;
  showFeedback(correct,answered,{kind:'cheer',emoji:'🦊',title:remaining?'冒险还在继续，先完成剩下的题吧！':'再试一步，就离勋章更近啦！',message:remaining?`还有 ${remaining} 题没作答。不用着急，小狐狸陪你一起想。`:`再答对 ${Math.max(0,needed)} 题就能通关！可以改正后再次检查，已经获得的勋章和星星不会减少。`});
 }
}
$('practice-mode').onclick=()=>setMode('practice');
$('adventure-mode').onclick=()=>setMode('adventure');
$('level-map').onclick=event=>{const button=event.target.closest('button[data-level]');if(button&&!button.disabled)startLevel(Number(button.dataset.level))};
$('g').onchange=$('t').onchange=()=>{units();clearSheet();renderMap()};
renderMap();

function updateCertificateAvailability() {
 const completed=routeStars().filter(Boolean).length;
 $('certificate-open').disabled=!completed;
 $('certificate-hint').textContent=completed?`已收集 ${completed} 枚勋章，把这段冒险变成专属纪念！`:'通关任意一关，即可领取专属成果证书。';
 if(!$('certificate-panel').hidden&&completed)renderCertificate();
}
function closeCertificate() {
 $('certificate-panel').hidden=true;
 $('certificate-open').setAttribute('aria-expanded','false');
 currentCertificate=null;
}
function renderCertificate() {
 const data=certificateData($('certificate-name').value,+$('g').value,+$('t').value,routeStars());
 if(!data.completed)return;
 const svg=certificateSVG(data,ADVENTURE_LEVELS);
 currentCertificate={data,svg};
 $('certificate-preview').src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 $('certificate-preview').alt=`${data.name}的${data.route}冒险成果证书，${data.title}，已通关${data.completed}关，收集${data.total}颗星，获得${data.completed}枚勋章。`;
 $('certificate-status').textContent='预览已更新，准备好就下载留念吧！';
}
function saveCertificate(blob,filename) {
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=filename;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function certificateFilename(data,extension) {
 return `星光探险-${data.route}-${data.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_')}.${extension}`;
}
$('certificate-open').onclick=()=>{
 if(!routeStars().some(Boolean))return;
 $('certificate-panel').hidden=false;
 $('certificate-open').setAttribute('aria-expanded','true');
 renderCertificate();
 $('certificate-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
};
$('certificate-close').onclick=closeCertificate;
$('certificate-name').oninput=renderCertificate;
$('certificate-svg').onclick=()=>{
 if(!currentCertificate)return;
 try {
  saveCertificate(new Blob([currentCertificate.svg],{type:'image/svg+xml;charset=utf-8'}),certificateFilename(currentCertificate.data,'svg'));
  $('certificate-status').textContent='已发起 SVG 下载，请在浏览器下载记录中查看。';
 }catch { $('certificate-status').textContent='下载未成功，请重试或长按证书预览保存图片。' }
};
$('certificate-download').onclick=async()=>{
 if(!currentCertificate)return;
 const snapshot=currentCertificate,button=$('certificate-download');
 button.disabled=true;$('certificate-status').textContent='正在制作高清证书…';
 try {
  if(document.fonts)await document.fonts.ready;
  const image=new Image();
  await new Promise((resolve,reject)=>{
   image.onload=resolve;image.onerror=()=>reject(new Error('证书图像加载失败'));
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(snapshot.svg);
  });
  const canvas=document.createElement('canvas');
  canvas.width=2400;canvas.height=1680;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('无法创建图像');
  context.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('无法导出图像');
  saveCertificate(blob,certificateFilename(snapshot.data,'png'));
  $('certificate-status').textContent='已发起高清 PNG 下载，请在浏览器下载记录中查看。';
 }catch {
  $('certificate-status').textContent='PNG 导出未成功，请重试，或选择“下载可缩放版 SVG”。';
 }finally {button.disabled=false}
};
