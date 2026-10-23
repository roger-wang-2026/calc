// 自绘 SVG 证书：无外部图片、字体或服务，离线也能导出。
const certificateEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function certificateData(name,grade,term,stars,date=new Date()) {
 const scores=Array.from({length:6},(_,i)=>Number.isInteger(stars[i])&&stars[i]>=1&&stars[i]<=3?stars[i]:0);
 const completed=scores.filter(Boolean).length,total=scores.reduce((a,b)=>a+b,0);
 return {name:Array.from(String(name).replace(/[\u0000-\u001f\u007f]/g,'').trim()||'勇敢的小探险家').slice(0,16).join(''),route:`${['一','二','三','四','五','六'][grade-1]}年级${term===1?'上':'下'}册`,stars:scores,completed,total,title:total===18?'满星传奇探险家':completed===6?'星辰小勇者':'闪光小探险家',date:`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`};
}
function certificateSVG(data, levels) {
 const esc=certificateEscape;
 const sparkle=(x,y,r,color='#EAB953')=>`<path d="M${x} ${y-r}Q${x+2} ${y-2} ${x+r} ${y}Q${x+2} ${y+2} ${x} ${y+r}Q${x-2} ${y+2} ${x-r} ${y}Q${x-2} ${y-2} ${x} ${y-r}" fill="${color}"/>`;
 const star=(x,y,r,fill)=>{let points=[];for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,k=i%2?r*.45:r;points.push(`${x+Math.cos(a)*k},${y+Math.sin(a)*k}`)}return `<polygon points="${points.join(' ')}" fill="${fill}"/>`};
 const icons=[
 '<path d="M0 24V-8" stroke="#318773" stroke-width="7" stroke-linecap="round"/><path d="M0 3Q-42 0-28-25Q0-26 0 3M0-8Q0-40 30-32Q37-6 0-8" fill="#64B893"/>',
 '<path d="M-10 0H10L14 30H-14Z" fill="#F3DCB8"/><path d="M-35 2A35 32 0 0 1 35 2Z" fill="#F18C78"/><circle cx="-16" cy="-10" r="7" fill="#FFF6DE"/><circle cx="10" cy="-19" r="6" fill="#FFF6DE"/><circle cx="23" cy="-5" r="5" fill="#FFF6DE"/>',
 '<path d="M-32-12-16-30H16L32-12 0 31Z" fill="#6ABFD6"/><path d="M-32-12H32M-16-30 0 31 16-30M-16-30 0-12 16-30" fill="none" stroke="#C7F0EF" stroke-width="3"/>',
 '<path d="M-30 30V-20H-20V-30H-10V-20H10V-30H20V-20H30V30Z" fill="#A599D4"/><path d="M-9 30V10A9 9 0 0 1 9 10V30" fill="#685A96"/><path d="M-36-20-20-43-4-20M4-20 20-43 36-20" fill="#F39E88"/>',
 '<path d="M-24 25Q-42-4-16-14L-10-34 2-25 20-30 30-12 18 4 0 2Q-14 11 0 25Z" fill="#74B693"/><circle cx="15" cy="-15" r="4" fill="#253E47"/><path d="M-26 9-45-5-42 18Z" fill="#F2C66A"/>',
 '<path d="M-32-16-16 0 0-31 16 0 32-16 24 25H-24Z" fill="#EABD54"/><rect x="-25" y="22" width="50" height="8" rx="4" fill="#CC9241"/><circle cy="8" r="6" fill="#7BBEB2"/>'
 ];
 const badges=levels.map((level,i)=>{
  const x=275+i*210,earned=data.stars[i]>0;
  return `<g transform="translate(${x} 702)"><circle r="62" fill="${earned?'#FFF4D6':'#F0F0E7'}" stroke="${earned?'#D5AF60':'#D5DDD5'}" stroke-width="3"/><g opacity="${earned?1:.22}">${icons[i]}</g><text y="92" class="badge-label">${esc(level.badge)}</text><text y="121" class="badge-stars" style="fill:${earned?'#B68025':'#A4B2AF'}">${earned?'★'.repeat(data.stars[i])+'☆'.repeat(3-data.stars[i]):'待点亮'}</text></g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1120" viewBox="0 0 1600 1120" role="img" aria-label="${esc(data.name)}的计算冒险成果证书">
 <defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#FFFDF2"/><stop offset="1" stop-color="#FFF0DB"/></linearGradient><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#254855"/><stop offset="1" stop-color="#39776F"/></linearGradient><style>text{font-family:'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',sans-serif;text-anchor:middle;fill:#284C50}.badge-label{font-size:21px;font-weight:700}.badge-stars{font-size:25px;letter-spacing:3px}</style></defs>
 <rect width="1600" height="1120" rx="36" fill="url(#paper)"/>
 <rect x="27" y="27" width="1546" height="1066" rx="26" fill="none" stroke="#397C74" stroke-width="4"/>
 <rect x="43" y="43" width="1514" height="1034" rx="20" fill="none" stroke="#DAB972" stroke-width="2" stroke-dasharray="5 9"/>
 <path d="M48 240Q225 120 370 210L280 48H48Z" fill="#DBEDE0"/><path d="M1552 240Q1375 120 1230 210L1320 48H1552Z" fill="#F8D9B8"/>
 ${[[115,110,15],[295,125,12],[1480,115,16],[1300,120,12],[360,300,12],[1240,300,12],[210,440,16],[1390,440,16]].map(p=>sparkle(...p)).join('')}
 <path d="M580 72H1020L1000 132H600Z" fill="#E7B85C"/><text x="800" y="112" font-size="22" font-weight="700" letter-spacing="7">小狐狸的星光探险</text>
 <text x="800" y="220" font-size="68" font-weight="900" letter-spacing="12">冒险成果证书</text>
 <text x="800" y="272" font-size="19" letter-spacing="6" fill="#6C8780">每一次勇敢尝试，都值得闪闪发光</text>
 <text x="800" y="359" font-size="44" font-weight="800" textLength="${Math.min(900,Math.max(220,Array.from(data.name).length*46))}" lengthAdjust="spacingAndGlyphs">${esc(data.name)}</text>
 <path d="M510 381Q800 395 1090 381" fill="none" stroke="#DDBB76" stroke-width="3"/>
 <text x="800" y="432" font-size="25">在${esc(data.route)}的计算冒险中，认真思考、勇敢前进</text>
 <rect x="510" y="462" width="580" height="76" rx="38" fill="url(#sky)"/>
 <text x="800" y="512" font-size="35" font-weight="800" style="fill:#FFF1CB">荣获 · ${esc(data.title)}</text>
 <text x="800" y="595" font-size="28" font-weight="700">已通关 ${data.completed} / 6 关　 ·　收集 ${data.total} / 18 颗星　 ·　获得 ${data.completed} 枚勋章</text>
 ${badges}
 <path d="M45 1010Q200 900 400 992T800 994T1200 985T1555 960V1076H45Z" fill="#D9E9D9"/>
 <path d="M45 1040Q300 985 550 1035T1000 1033T1555 1015V1076H45Z" fill="#BBD6C4"/>
 <g transform="translate(170 970) scale(.72)">
 <path d="M-75-42-78-128-16-88 20-88 78-128 75-42Q70 54 0 65Q-70 54-75-42" fill="#EC9854" stroke="#B96F3C" stroke-width="3"/>
 <path d="M-64-64-65-106-32-82M64-64 65-106 32-82" fill="#634B49"/>
 <path d="M-70-8Q-42-18 0 33Q42-18 70-8Q52 62 0 65Q-52 62-70-8" fill="#FFF7DE"/>
 <ellipse cx="-29" cy="-18" rx="6" ry="9" fill="#30494B"/><ellipse cx="29" cy="-18" rx="6" ry="9" fill="#30494B"/>
 <path d="M-10 27Q0 22 10 27L0 39Z" fill="#30494B"/><path d="M-12 46Q0 57 12 46" fill="none" stroke="#30494B" stroke-width="3" stroke-linecap="round"/>
 <path d="M-20-96-8-119 4-105 18-125 30-96Z" fill="#E7BA55"/>
 </g>
 <g transform="translate(1400 965)" fill="#7FA99A"><path d="M-75 40V-40H-50V-10H-25V-80H25V-10H50V-40H75V40Z"/><path d="M-87-40-62-77-37-40M-40-80 0-132 40-80M37-40 62-77 87-40" fill="#D8AD66"/><path d="M-13 40V8A13 13 0 0 1 13 8V40" fill="#DDE9D7"/><path d="M0-130V-166L38-154 0-143" fill="#D98E79"/></g>
 <text x="800" y="910" font-size="25" font-weight="700">${data.completed===6?'六枚勋章，一路成长。下一段冒险，继续闪耀！':'把好奇心装进行囊，下一枚勋章正在等你！'}</text>
 <text x="800" y="958" font-size="21">小狐狸探险队 · 成长见证　　${esc(data.date)}</text>
 <text x="800" y="1039" font-size="18" letter-spacing="4">认真 · 勇气 · 坚持 · 好奇心</text>
 ${star(370,920,12,'#E2B85D')}${star(1220,910,12,'#E2B85D')}
 </svg>`;
}
if(typeof module!=='undefined')module.exports={certificateData,certificateSVG,certificateEscape};
