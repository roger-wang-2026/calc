// 组卷和判题独立于页面，浏览器与 Node 共用。
function buildPractice(units, count, allowRepeat = false, includeSource = false) {
  if (!Number.isInteger(count) || count < 1) throw new Error('题量必须为正整数');
  const questions = [], seen = new Set();
  // 每个单元有独立的尝试预算；题目较少的单元不会阻塞其他单元。
  let active = units.map(unit => ({ unit, misses: 0 }));
  const limit = Math.max(300, count * 40);
  while (questions.length < count && active.length) {
    const next = [];
    for (const entry of active) {
      if (questions.length >= count) break;
      let accepted = false;
      while (entry.misses < limit) {
        const row = entry.unit.f();
        if (row && (allowRepeat || !seen.has(row[0]))) {
          seen.add(row[0]);
          const question=[row[0], String(row[1]), row[2] || '='];
          if(includeSource)question.push(entry.unit.n);
          questions.push(question);
          entry.misses = 0;
          accepted = true;
          break;
        }
        entry.misses++;
      }
      if (accepted) next.push(entry);
    }
    active = next;
  }
  return questions;
}
const normalizeAnswer = value => String(value).trim()
  .replace(/(余|\.{2,}|。{2,}|⋯|…)+/g, '…')
  .replace(/：/g, ':').replace(/％/g, '%').replace(/\s/g, '');
function parseAnswer(value) {
  const text = normalizeAnswer(value);
  const fraction = text.match(/^([+-]?\d+)\/(\d+)$/);
  if (fraction) return +fraction[2] ? +fraction[1] / +fraction[2] : null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
function answerMatches(value, answer) {
  const expected = normalizeAnswer(answer);
  if (/[…:%]/.test(expected)) return normalizeAnswer(value) === expected;
  const actualNumber = parseAnswer(value), expectedNumber = parseAnswer(expected);
  return actualNumber !== null && expectedNumber !== null && Math.abs(actualNumber - expectedNumber) < 1e-9;
}
if (typeof module !== 'undefined') module.exports = { buildPractice, parseAnswer, answerMatches };
