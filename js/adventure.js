// 每个年级、学期独立探索；知识点逐步加入，题量与通关目标逐步提高。
const ADVENTURE_LEVELS = [
 { name:'萌芽营地', icon:'🌱', badge:'勇气萌芽', story:'小狐狸正在营地等你，点亮第一盏探险灯吧！', count:5, target:.6, coverage:.2 },
 { name:'蘑菇森林', icon:'🍄', badge:'森林伙伴', story:'沿着蘑菇路标前进，帮小松鼠找到回家的路。', count:6, target:.7, coverage:.35 },
 { name:'星光小溪', icon:'💎', badge:'水晶探索者', story:'算出踏脚石的秘密，带着水晶渡过星光小溪。', count:8, target:.75, coverage:.5 },
 { name:'云端城堡', icon:'🏰', badge:'云端守护者', story:'城堡的大门就要开启，用细心点亮云朵阶梯！', count:10, target:.8, coverage:.7 },
 { name:'巨龙山谷', icon:'🐉', badge:'友善驯龙师', story:'小龙想和你做朋友，一起解开山谷里的计算谜题。', count:12, target:.8, coverage:.85 },
 { name:'星辰之巅', icon:'👑', badge:'星辰小勇者', story:'带上一路收获的本领，点亮属于你的星辰王冠！', count:15, target:.9, coverage:1 }
];
function adventureUnits(units, level) {
 return units.slice(0, Math.max(1, Math.ceil(units.length * level.coverage)));
}
function adventureResult(level, correct, total, answered, firstCorrect = correct) {
 const passed=total===level.count && answered===total && correct===total;
 return {passed,stars:passed?(firstCorrect===total?3:firstCorrect/total>=.8?2:1):0};
}
function readAdventureProgress(raw) {
 try {
  const data=JSON.parse(raw),clean={};
  if(!data || typeof data!=='object')return clean;
  for(let g=1;g<=6;g++)for(let t=1;t<=2;t++) {
   const key=`${g}-${t}`,values=data[key];
   if(!Array.isArray(values))continue;
   clean[key]=ADVENTURE_LEVELS.map((_,i)=>Number.isInteger(values[i])&&values[i]>=0&&values[i]<=3?values[i]:0);
   // 锁定关系不能被损坏的存档打破。
   let locked=false;
   clean[key]=clean[key].map(stars=>{if(locked)return 0;if(!stars)locked=true;return stars});
  }
  return clean;
 } catch {return {}}
}
if(typeof module!=='undefined')module.exports={ADVENTURE_LEVELS,adventureUnits,adventureResult,readAdventureProgress};
