// 将本地 Canvas 页面封装为 PDF；不依赖浏览器打印、外部服务或字体下载。
function worksheetText(html) {
 return html.replace(/<span class="fr"><i>(\d+)<\/i><i>(\d+)<\/i><\/span>/g,'($1/$2)').replace(/<[^>]*>/g,'');
}
function worksheetPages(questions,spacing,columns,answers=false) {
 const rowHeight={s0:88,s1:132,s2:220}[spacing]||132;
 const capacity=Math.floor((1754-270)/rowHeight)*columns;
 const pages=[];
 for(let i=0;i<questions.length;i+=capacity)pages.push({questions:questions.slice(i,i+capacity),start:i,columns,rowHeight,answers:false});
 if(answers)for(let i=0;i<questions.length;i+=54)pages.push({questions:questions.slice(i,i+54),start:i,columns:3,rowHeight:75,answers:true});
 return pages;
}
function worksheetPDF(images) {
 const encoder=new TextEncoder(),chunks=[];let length=0;
 const append=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length};
 const offsets=[0];
 const object=(id,body)=>{offsets[id]=length;append(`${id} 0 obj\n`);append(body);append('\nendobj\n')};
 append('%PDF-1.4\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,`<< /Type /Pages /Count ${images.length} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 images.forEach((image,i)=>{
  const id=3+i*3,content='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
  offsets[id+1]=length;append(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`);append(image);append('\nendstream\nendobj\n');
  object(id+2,`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
 });
 const xref=length;append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
 for(const offset of offsets.slice(1))append(`${String(offset).padStart(10,'0')} 00000 n \n`);
 append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(chunks,{type:'application/pdf'});
}
async function createWorksheetPDF(questions,options) {
 if(!questions.length)throw new Error('请先生成题目');
 if(document.fonts)await document.fonts.ready;
 const pages=worksheetPages(questions,options.spacing,options.columns,options.answers),images=[];
 for(let pageIndex=0;pageIndex<pages.length;pageIndex++) {
  const page=pages[pageIndex],canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建导出页面');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#172d36';
  const font=size=>`${size}px "PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.textAlign='center';ctx.font=font(38);ctx.fillText('星光算术岛 · '+(page.answers?'参考答案':'计算练习'),620,85);
  ctx.font=font(23);ctx.fillText(options.route,620,128);ctx.textAlign='left';
  if(!page.answers){ctx.font=font(21);ctx.fillText('姓名：____________    日期：____________    用时：________',70,184)}
  page.questions.forEach((q,i)=>{
   const x=70+(i%page.columns)*(1100/page.columns),y=245+Math.floor(i/page.columns)*page.rowHeight,width=1100/page.columns-30;
   const text=page.answers?`${page.start+i+1}. ${q[1]}`:`${page.start+i+1}. ${worksheetText(q[0])}${q[2]==='='?' = ______':'，x = ______'}`;
   let lines=[],lineHeight=35;
   for(const size of [25,22,20,18,16]) {
    ctx.font=font(size);lineHeight=size*1.4;lines=[];
    let line='';
    for(const char of text){if(ctx.measureText(line+char).width>width&&line){lines.push(line);line=''}line+=char}
    if(line)lines.push(line);
    if(lines.length*lineHeight<=page.rowHeight-8)break;
   }
   lines.forEach((line,j)=>ctx.fillText(line,x,y+j*lineHeight));
  });
  ctx.font=font(18);ctx.textAlign='center';ctx.fillText(`星光算术岛 · 第 ${pageIndex+1} / ${pages.length} 页`,620,1705);
  const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));if(!jpeg)throw new Error('无法导出页面');
  images.push(new Uint8Array(await jpeg.arrayBuffer()));canvas.width=0;canvas.height=0;
 }
 return worksheetPDF(images);
}
if(typeof module!=='undefined')module.exports={worksheetText,worksheetPages,worksheetPDF};
