const assert=require('node:assert/strict');
const {worksheetText,worksheetPages,worksheetPDF}=require('../js/worksheet');
const questions=Array.from({length:40},(_,i)=>[`${i} + 1`,String(i+1),'=']);
assert.equal(worksheetText('<span class="fr"><i>1</i><i>2</i></span> × 3'),'(1/2) × 3');
for(const spacing of ['s0','s1','s2'])for(const columns of [2,3]) {
 const pages=worksheetPages(questions,spacing,columns,true),practice=pages.filter(p=>!p.answers);
 assert.equal(practice.flatMap(p=>p.questions).length,40);
 assert.equal(pages.filter(p=>p.answers).length,1);
 for(const page of pages){const bottom=245+(Math.ceil(page.questions.length/page.columns)-1)*page.rowHeight;assert.ok(bottom+page.rowHeight<1705)}
}
(async()=>{
 const blob=worksheetPDF([new Uint8Array([255,216,255,217]),new Uint8Array([255,216,255,217])]);
 assert.equal(blob.type,'application/pdf');
 const bytes=Buffer.from(await blob.arrayBuffer()),text=bytes.toString();
 assert.match(text,/%PDF-1.4/);assert.match(text,/\/Count 2/);
 const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(bytes.subarray(xref,xref+4).toString(),'xref');
 const entries=text.slice(text.indexOf('xref\n')).split('\n').slice(3,11);
 entries.forEach((line,i)=>{const offset=Number(line.slice(0,10));assert.ok(bytes.subarray(offset).toString().startsWith(`${i+1} 0 obj`))});
 console.log('练习卷测试通过：两/三列、三种留白分页、独立答案页及PDF交叉引用。');
})().catch(error=>{console.error(error);process.exitCode=1});
