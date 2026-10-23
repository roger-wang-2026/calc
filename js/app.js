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
 clearFeedback();clearExport();
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
 <div class="g${c==3?' c3':''}" style="--c:${c}">`+QS.map((q,i)=>`<div class="p${q[2]==='='?'':' equation'}"><span class="n">${i+1}.</span><span>${q[0]}${q[2]==='='?'':'，'}</span><span class="answer-field"><span>${q[2]}</span><input aria-label="第${i+1}题答案" ${/^\d+(\.\d+)?$/.test(q[1])?'inputmode="decimal"':''} autocomplete="off"></span><span class="m"></span></div>`).join('')+`</div>
 <div class="ans"><b>参考答案</b><div class="g c3" style="--c:3">`+QS.map((q,i)=>`<span>${i+1}. ${q[1]}</span>`).join('')+`</div></div>`;
 $('sheet').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
$('chk').onclick=()=>{
 if(!QS.length)return;
 if(mode==='adventure'&&activeLevel){submitChallenge();return}
 let correct=0,answered=0;
 document.querySelectorAll('#sheet .p').forEach((p,i)=>{
  const value=p.querySelector('input').value,filled=value.trim()!=='';
  const right=filled&&answerMatches(value,QS[i][1]);
  if(filled)answered++;
  if(right)correct++;
  p.className='p '+(QS[i][2]==='='?'':'equation ')+(right?'ok':filled?'bad':'');
  p.querySelector('.m').textContent=right?'✓':filled?'✗ 再算一次':'待作答';
 });
 document.querySelector('.hd span').innerHTML=`得分：<b>${correct}</b> / ${QS.length}`;
 if(mode==='adventure'&&activeLevel)finishLevel(correct,answered);
 else showFeedback(correct,answered);
};
$('pa').onchange=e=>document.body.classList.toggle('pa',e.target.checked);
let worksheetURL=null;
function clearExport() {
 $('export-panel').hidden=true;$('export-link').hidden=true;
 if(worksheetURL){URL.revokeObjectURL(worksheetURL);worksheetURL=null}
}
$('pr').onclick=()=>{
 $('export-panel').hidden=false;
 $('export-status').textContent=QS.length?'请选择下载 PDF 或系统打印。':'请先生成题目或开始一个关卡，再导出练习卷。';
 $('export-pdf').disabled=!QS.length;$('export-print').disabled=!QS.length;
 $('export-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
};
$('export-close').onclick=()=>{$('export-panel').hidden=true};
$('export-print').onclick=()=>{
 if(!QS.length)return;
 $('export-status').textContent='正在请求系统打印。如果没有出现打印窗口，请使用“下载 A4 练习卷 PDF”。';
 try {if(typeof window.print!=='function')throw new Error('不支持打印');window.print()}
 catch {$('export-status').textContent='当前浏览器不支持系统打印，请直接下载 PDF。'}
};
$('export-pdf').onclick=async()=>{
 if(!QS.length)return;
 const button=$('export-pdf'),snapshot=QS;
 button.disabled=true;$('export-status').textContent='正在制作 PDF，请稍等…';
 try {
  const blob=await createWorksheetPDF(snapshot,{route:`${N[+$('g').value-1]}年级${$('t').value==='1'?'上':'下'}册`,spacing:mode==='adventure'?'s1':$('sp').value,columns:mode==='adventure'?2:+$('cols').value,answers:mode!=='adventure'&&$('pa').checked});
  if(snapshot!==QS)return;
  if(worksheetURL)URL.revokeObjectURL(worksheetURL);
  worksheetURL=URL.createObjectURL(blob);
  const link=$('export-link');link.href=worksheetURL;link.hidden=false;
  const download=document.createElement('a');download.href=worksheetURL;const now=new Date(),pad=value=>String(value).padStart(2,'0');
  const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  download.download=`星光算术岛-计算练习-${stamp}.pdf`;
  document.body.appendChild(download);download.click();download.remove();
  $('export-status').textContent='PDF 已生成。如果没有自动下载，请点击下方链接打开预览，再通过分享菜单保存或打印。';
 } catch {$('export-status').textContent='PDF 生成失败，请重试；也可以在 Safari 或 Chrome 中打开本页后再下载。'}
 finally {button.disabled=!QS.length}
};
$('th').onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme=='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=d?'light':'dark'};

let challengeState=null,challengeTimer;
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
  const locked=i>0&&!stars[i-1];
  return `<button class="level-card ${stars[i]?'completed':locked?'locked':'unlocked'}" data-level="${i}" ${locked?'disabled':''}><span class="level-icon" aria-hidden="true">${locked?'🔒':level.icon}</span><span class="level-number">第 ${i+1} 关</span><strong>${level.name}</strong><span>${level.count} 题 · 逐题答对通关</span><span class="level-stars" aria-label="${stars[i]}颗星">${'★'.repeat(stars[i])}${'☆'.repeat(3-stars[i])}</span><span>${stars[i]?'再挑战，收集三星':locked?'完成上一关解锁':'出发探险 →'}</span></button>`;
 }).join('');
 $('badge-shelf').innerHTML=ADVENTURE_LEVELS.map((level,i)=>`<div class="badge ${stars[i]?'earned':''}"><span aria-hidden="true">${stars[i]?level.icon:'🔒'}</span><strong>${level.badge}</strong><small>${stars[i]?'已获得':'通关第'+(i+1)+'关获得'}</small></div>`).join('');
 updateCertificateAvailability();
 $('save-note').textContent=storageAvailable?'进度保存在当前浏览器，各年级、学期分别记录。清除浏览器数据会丢失收藏。':'当前浏览器无法保存进度，本次打开期间仍可继续闯关。';
}
function clearSheet() {
 closeCertificate();clearExport();
 stopChallenge();
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
 clearFeedback();clearExport();stopChallenge();
 const level=ADVENTURE_LEVELS[index],pool=adventureUnits(T.filter(u=>u.g===+$('g').value&&u.t===+$('t').value),level);
 QS=buildPractice(pool,level.count,true);
 activeLevel={index,key:routeKey()};
 $('mission').hidden=true;$('sheet').replaceChildren();$('status').textContent='';
 challengeState={answers:QS.map(()=>null),queue:QS.map((_,i)=>i),cursor:0,busy:false};
 document.body.classList.add('adventure-playing');
 $('challenge').hidden=false;
 renderChallenge();
 $('challenge').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});

}
function finishLevel(correct,answered) {
 clearTimeout(challengeTimer);$('challenge').hidden=true;document.body.classList.remove('adventure-playing');
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

function stopChallenge() {
 clearTimeout(challengeTimer);challengeState=null;
 $('challenge').hidden=true;document.body.classList.remove('adventure-playing');
}
function renderChallenge() {
 const state=challengeState,index=state.queue[state.cursor],q=QS[index],level=ADVENTURE_LEVELS[activeLevel.index];
 state.busy=false;
 $('challenge').className='challenge';
 $('challenge-count').textContent=`第 ${state.cursor+1} / ${state.queue.length} 题`;
 $('challenge-progress').innerHTML=state.queue.map((i,pos)=>`<span class="${pos===state.cursor?'current':state.answers[i]===true?'done':state.answers[i]===false?'review':''}" aria-label="第${pos+1}题${pos===state.cursor?'，当前题':state.answers[i]===true?'，已答对':''}"></span>`).join('');
 $('challenge-icon').textContent=level.icon;
 $('challenge-level').textContent=`第 ${activeLevel.index+1} 关 · ${level.name}`;
 $('challenge-title').textContent=state.queue.length===QS.length?'点亮这一站的星光':'错题再探险';
 $('challenge-goal').textContent=`本关 ${QS.length} 题 · 已点亮 ${state.answers.filter(a=>a===true).length} 题 · 答对才能继续`;
 $('challenge-question').innerHTML=q[0];
 $('challenge-prefix').textContent=q[2]==='='?'答案':q[2];
 const input=$('challenge-input');input.value='';input.disabled=false;
 input.setAttribute('inputmode',/^\d+(\.\d+)?$/.test(q[1])?'decimal':'text');
 input.setAttribute('aria-invalid','false');
 $('challenge-format').textContent=q[1].includes('…')?'余数可以这样填：2余1':q[1].includes('/')?'分数可以这样填：1/2':q[1].includes('%')?'记得加上 % 符号':q[1].includes(':')?'比可以这样填：1:2':'';
 $('challenge-message').textContent='一次只想一题，慢慢来也很棒！';
 $('challenge-submit').disabled=false;$('challenge-submit').textContent='确认答案 →';
 $('challenge-next').hidden=true;
 input.focus({preventScroll:true});
}
function submitChallenge() {
 if(!challengeState||challengeState.busy)return;
 const state=challengeState,index=state.queue[state.cursor],input=$('challenge-input'),value=input.value.trim();
 if(!value){$('challenge-message').textContent='先填一个答案吧，小狐狸等着和你一起出发！';input.focus({preventScroll:true});return}
 const right=answerMatches(value,QS[index][1]);
 if(right) {
  state.answers[index]=true;state.busy=true;
  $('challenge').className='challenge correct';
  $('challenge-message').textContent=['算对啦！一颗星光为你亮起 ✨','太棒了，继续向前探索吧！🌟','认真思考的你，正在闪闪发光！'][state.cursor%3];
  input.disabled=true;$('challenge-submit').disabled=true;
  $('challenge-next').textContent=state.cursor===state.queue.length-1?'查看闯关成果 →':'下一题 →';
  $('challenge-next').hidden=false;
  challengeTimer=setTimeout(advanceChallenge,1200);
 } else {
  $('challenge').className='challenge try-again';input.setAttribute('aria-invalid','true');
  $('challenge-message').textContent='还差一点点！检查一下数字和运算符号，订正正确后，我们再一起向前走。';
  $('challenge-submit').textContent='再试一次 →';input.focus({preventScroll:true});input.select();
 }
}
function advanceChallenge() {
 if(!challengeState||!challengeState.busy)return;
 clearTimeout(challengeTimer);
 const state=challengeState;
 if(state.cursor+1<state.queue.length){state.cursor++;renderChallenge()}
 else {state.busy=false;finishLevel(state.answers.filter(a=>a===true).length,state.answers.filter(a=>a!==null).length)}
}
$('challenge-form').onsubmit=event=>{event.preventDefault();submitChallenge()};
$('challenge-next').onclick=advanceChallenge;
$('challenge-back').onclick=()=>{clearSheet();$('adventure').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})};
