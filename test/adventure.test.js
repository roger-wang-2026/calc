const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {T}=require('../js/generators');
const {buildPractice}=require('../js/practice');
const {ADVENTURE_LEVELS:levels,adventureUnits,adventureResult,readAdventureProgress}=require('../js/adventure');
for(let g=1;g<=6;g++)for(let t=1;t<=2;t++) {
 const units=T.filter(u=>u.g===g&&u.t===t);
 let previous=0;
 for(const level of levels) {
  const pool=adventureUnits(units,level);
  assert.ok(pool.length>=previous);previous=pool.length;
  const questions=buildPractice(pool,level.count,true);
  assert.equal(questions.length,level.count);
  const needed=Math.ceil(level.count*level.target);
  assert.equal(adventureResult(level,needed,level.count,level.count).passed,true);
  assert.equal(adventureResult(level,needed-1,level.count,level.count).passed,false);
  assert.equal(adventureResult(level,needed,level.count,level.count-1).passed,false);
  assert.equal(adventureResult(level,level.count,level.count,level.count).stars,3);
 }
}
assert.deepEqual(readAdventureProgress('bad'),{});
assert.deepEqual(readAdventureProgress('{"1-1":[3,1,0,3]}')['1-1'],[3,1,0,0,0,0]);
assert.deepEqual(readAdventureProgress('{"1-1":["3",4,-1]}')['1-1'],[0,0,0,0,0,0]);
// 用独立页面上下文验证真正的按钮处理器、存档恢复与奖励流程。
function page(storage,unavailable=false) {
 const element=()=>({value:'',innerHTML:'',textContent:'',hidden:false,children:[],style:{},classList:{toggle(){},remove(){}},replaceChildren(){this.children=[];this.innerHTML=''},appendChild(child){this.children.push(child)},scrollIntoView(){},setAttribute(key,value){this[key]=value}});
 const ids=['g','t','u','n','repeat','status','sheet','cols','sp','go','chk','pa','pr','th','feedback','effects','adventure','adventure-progress','trail-fill','level-map','badge-shelf','save-note','mission','practice-mode','adventure-mode','certificate-open','certificate-hint','certificate-panel','certificate-name','certificate-close','certificate-preview','certificate-status','certificate-download','certificate-svg','export-panel','export-pdf','export-print','export-close','export-status','export-link'];
 const els=Object.fromEntries(ids.map(id=>[id,element()]));
 els['export-panel'].hidden=true;els['certificate-panel'].hidden=true;els.g.value='1';els.t.value='1';els.n.value='10';els.repeat.value='no';els.cols.value='2';els.sp.value='s1';
 const header=element();let rows=[];
 const context=vm.createContext({window:{print(){}},document:{body:element(),getElementById:id=>els[id],createElement:element,querySelector:()=>header,querySelectorAll:s=>s==='#u input:checked'?[{value:'0'}]:rows},localStorage:{getItem(key){if(unavailable)throw Error('disabled');return storage[key]||null},setItem(key,value){if(unavailable)throw Error('disabled');storage[key]=value}},matchMedia:()=>({matches:true}),clearTimeout(){},setTimeout(){return 1},alert(){throw Error('unexpected alert')}});
 for(const file of ['generators','practice','feedback','adventure','certificate','worksheet','app'])vm.runInContext(fs.readFileSync(`${__dirname}/../js/${file}.js`,'utf8'),context);
 return {els,context,answer(allCorrect=true){const answers=vm.runInContext('QS.map(q=>q[1])',context);rows=answers.map(answer=>{const input={value:allCorrect?answer:'wrong'},mark=element();return {querySelector:s=>s==='input'?input:mark}});els.chk.onclick()}};
}
const storage={},p=page(storage);
assert.equal(p.els['certificate-open'].disabled,true);
p.els['adventure-mode'].onclick();
assert.equal(p.els.adventure.hidden,false);
vm.runInContext('startLevel(1)',p.context);assert.equal(vm.runInContext('QS.length',p.context),0);
vm.runInContext('startLevel(0)',p.context);p.answer(false);assert.match(p.els.feedback.innerHTML,/再试一步/);assert.equal(Object.keys(storage).length,0);
p.answer();assert.match(p.els.feedback.innerHTML,/勇气萌芽/);assert.equal(JSON.parse(storage['pep-calc-adventure-v1'])['1-1'][0],3);
p.els['certificate-open'].onclick();assert.equal(p.els['certificate-panel'].hidden,false);assert.match(p.els['certificate-preview'].alt,/获得1枚勋章/);
p.els['certificate-name'].value='<小明&>';p.els['certificate-name'].oninput();assert.match(decodeURIComponent(p.els['certificate-preview'].src),/&lt;小明&amp;&gt;/);
p.els.feedback.children[0].onclick();assert.match(p.els.mission.innerHTML,/蘑菇森林/);
for(let i=1;i<6;i++){vm.runInContext(`startLevel(${i})`,p.context);p.answer()}
assert.match(p.els.feedback.innerHTML,/六枚勋章集齐/);
p.els['certificate-open'].onclick();assert.match(p.els['certificate-preview'].alt,/满星传奇探险家/);
assert.deepEqual(JSON.parse(storage['pep-calc-adventure-v1'])['1-1'],[3,3,3,3,3,3]);
p.els.g.value='2';p.els.g.onchange();assert.equal(p.els['certificate-panel'].hidden,true);assert.equal(p.els['certificate-open'].disabled,true);assert.match(p.els['adventure-progress'].textContent,/已通关 0/);assert.equal(vm.runInContext('QS.length',p.context),0);
p.els.g.value='1';p.els.g.onchange();assert.match(p.els['adventure-progress'].textContent,/已通关 6/);
p.els['practice-mode'].onclick();assert.equal(p.els.adventure.hidden,true);p.els.go.onclick();assert.equal(vm.runInContext('QS.length',p.context),10);
p.els.pr.onclick();assert.equal(p.els['export-panel'].hidden,false,'打印接口静默无响应时仍应显示导出入口');
const restored=page(storage);assert.match(restored.els['adventure-progress'].textContent,/已通关 6/);
const fallback=page({},true);fallback.els['adventure-mode'].onclick();vm.runInContext('startLevel(0)',fallback.context);fallback.answer();assert.match(fallback.els['save-note'].textContent,/无法保存/);assert.match(fallback.els['adventure-progress'].textContent,/已通关 1/);
console.log('闯关测试通过：12条路线、72个关卡配置，解锁、重试、三星、全通关、年级隔离、存档恢复和存储不可用。');
(async()=>{
 const downloads=[],p=page({'pep-calc-adventure-v1':'{"1-1":[3,3,1,3,3,3]}'});
 const ctx=p.context,create=ctx.document.createElement;
 ctx.Blob=Blob;ctx.URL={createObjectURL(blob){assert.ok(blob.size>0);return 'blob:test'},revokeObjectURL(){}};
 ctx.Image=class {set src(value){assert.match(value,/^data:image\/svg\+xml/);queueMicrotask(()=>this.onload())}};
 ctx.document.fonts={ready:Promise.resolve()};
 ctx.document.createElement=tag=>{
  if(tag==='canvas')return {getContext(){return {drawImage(){}}},toBlob(callback,type){assert.equal(this.width,2400);assert.equal(this.height,1680);assert.equal(type,'image/png');callback(new Blob(['png'],{type}))}};
  const element=create();element.click=()=>downloads.push(element.download);element.remove=()=>{};return element;
 };
 p.els['adventure-mode'].onclick();p.els['certificate-open'].onclick();
 await p.els['certificate-download'].onclick();assert.match(downloads[0],/\.png$/);assert.match(p.els['certificate-status'].textContent,/已发起高清 PNG/);assert.equal(p.els['certificate-download'].disabled,false);
 p.els['certificate-svg'].onclick();assert.match(downloads[1],/\.svg$/);
 ctx.Image=class {set src(value){queueMicrotask(()=>this.onerror())}};
 await p.els['certificate-download'].onclick();assert.match(p.els['certificate-status'].textContent,/PNG 导出未成功/);assert.equal(p.els['certificate-download'].disabled,false);
 console.log('证书交互测试通过：预览、成果同步、切换路线、PNG/SVG下载处理及导出失败恢复。');
})().catch(error=>{console.error(error);process.exitCode=1});
