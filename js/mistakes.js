// 错题仅保存在本机；同一知识点的原题与变式组成一次复练。
function mistakeId(route,unit,expression) {return JSON.stringify([route,unit,expression])}
function readMistakes(raw,units) {
 try {
  const data=JSON.parse(raw);if(!Array.isArray(data))return [];
  const clean=new Map();
  for(const entry of data) {
   if(!entry||!/^([1-6])-([12])$/.test(entry.route)||!Number.isInteger(entry.level)||entry.level<0||entry.level>5)continue;
   if(!units.some(u=>`${u.g}-${u.t}`===entry.route&&u.n===entry.unit))continue;
   const q=entry.question;
   if(!Array.isArray(q)||q.length!==3||q.some(v=>typeof v!=='string')||q[0].length>600||q[1].length>64||!['=','x ='].includes(q[2]))continue;
   const plain=q[0].replace(/<span class="fr"><i>\d+<\/i><i>\d+<\/i><\/span>/g,'');
   if(/[<>&]/.test(plain)||/[<>&]/.test(q[1]))continue;
   const id=mistakeId(entry.route,entry.unit,q[0]);
   clean.set(id,{id,route:entry.route,unit:entry.unit,level:entry.level,question:q,streak:[0,1,2].includes(entry.streak)?entry.streak:0,lastReviewed:Number.isFinite(entry.lastReviewed)?entry.lastReviewed:0});
  }
  return [...clean.values()];
 }catch{return []}
}
function recordMistake(entries,question,route,level,unit) {
 const id=mistakeId(route,unit,question[0]),entry={id,question:question.slice(0,3),route,level,unit,streak:0,lastReviewed:0};
 return entries.some(e=>e.id===id)?entries.map(e=>e.id===id?{...e,streak:0}:e):[...entries,entry];
}
function buildReview(entries,units,route,limit=5) {
 const selected=entries.filter(e=>e.route===route&&e.streak<2).sort((a,b)=>a.lastReviewed-b.lastReviewed).slice(0,limit);
 const questions=[],groups=[];
 for(const entry of selected) {
  const indexes=[questions.length];questions.push([...entry.question,entry.unit]);
  const unit=units.find(u=>`${u.g}-${u.t}`===route&&u.n===entry.unit);
  let variant;
  for(let i=0;unit&&i<100;i++){const candidate=unit.f();if(candidate&&candidate[0]!==entry.question[0]){variant=candidate;break}}
  // 无法生成不同变式时不冒充变式，仍可复习原题。
  if(variant){indexes.push(questions.length);questions.push([variant[0],String(variant[1]),variant[2]||'=',entry.unit])}
  groups.push({id:entry.id,indexes});
 }
 return {questions,groups};
}
function completeReview(entries,groups,firstCorrect,time=Date.now()) {
 return entries.map(entry=>{
  const group=groups.find(g=>g.id===entry.id);if(!group)return entry;
  const independent=group.indexes.every(i=>firstCorrect[i]===true);
  return {...entry,streak:independent?Math.min(2,entry.streak+1):0,lastReviewed:time};
 });
}
if(typeof module!=='undefined')module.exports={mistakeId,readMistakes,recordMistake,buildReview,completeReview};
