// 固定随机序列，覆盖所有单元以及组卷、判题边界。
const assert = require('node:assert/strict');
const { T } = require('../js/generators.js');
const { buildPractice, parseAnswer, answerMatches } = require('../js/practice.js');
let seed = 20261023;
const originalRandom = Math.random;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const fractions = html => html.replace(/<span class="fr"><i>(\d+)<\/i><i>(\d+)<\/i><\/span>/g, '($1/$2)');
const evaluate = expression => {
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  assert.match(normalized, /^[\d\s.+*/()\-]+$/);
  return Function(`return (${normalized})`)();
};
const close = (actual, expected, message) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, message);
let checked = 0;
try {
  for (const unit of T) for (let i = 0; i < 500; i++) {
    const row = unit.f();
    assert.ok(row, unit.n);
    const expression = fractions(row[0]), answer = String(row[1]);
    const context = `${unit.n}: ${expression} → ${answer}`;
    let match;
    if (expression.includes('x')) {
      const x = parseAnswer(answer);
      const sides = expression.replace(/(\d)x/g, '$1*x').replace(/x/g, `(${x})`).split('=');
      if (expression.includes(':')) {
        const [a,b] = sides[0].split(':').map(evaluate);
        const [c,d] = sides[1].split(':').map(evaluate);
        close(a / b, c / d, context);
      } else close(evaluate(sides[0]), evaluate(sides[1]), context);
    } else if (answer.includes('…')) {
      const [dividend, divisor] = expression.split('÷').map(Number);
      const [quotient, remainder] = answer.split('…').map(Number);
      assert.ok(remainder > 0 && remainder < divisor, context);
      assert.equal(dividend, quotient * divisor + remainder, context);
    } else if ((match = expression.match(/^(化简比|求比值) (\d+) : (\d+)$/))) {
      if (match[1] === '化简比') {
        const [a,b] = answer.split(':').map(Number);
        close(a / b, +match[2] / +match[3], context);
        const gcd = (a,b) => b ? gcd(b,a%b) : a;
        assert.equal(gcd(a,b), 1, context);
      } else close(parseAnswer(answer), +match[2] / +match[3], context);
    } else if ((match = expression.match(/^(.+) 化成百分数$/))) {
      assert.ok(answer.endsWith('%'), context);
      close(parseFloat(answer), evaluate(match[1]) * 100, context);
    } else if ((match = expression.match(/^(\d+)% 化成小数$/))) {
      close(parseAnswer(answer), +match[1] / 100, context);
    } else if ((match = expression.match(/^(\d+) 的 (\d+)% 是多少$/))) {
      close(parseAnswer(answer), +match[1] * +match[2] / 100, context);
    } else if ((match = expression.match(/^原价 (\d+) 元，打 (\d+) 折，现价（元）$/))) {
      close(parseAnswer(answer), +match[1] * +match[2] / 10, context);
    } else if ((match = expression.match(/^存 (\d+) 元，年利率 (\d+)%，存 (\d+) 年，利息（元）$/))) {
      close(parseAnswer(answer), +match[1] * +match[2] * +match[3] / 100, context);
    } else {
      const value = evaluate(expression);
      assert.ok(value >= 0, context);
      close(value, parseAnswer(answer), context);
    }
    assert.ok(answerMatches(answer, answer), context);
    // 知识点约束独立于算术结果。
    if (unit.n === '20以内进位加法') {
      const [a,b] = expression.split('+').map(Number);
      assert.ok(a < 10 && b < 10 && a + b >= 10 && a + b <= 20, context);
    }
    if (unit.n === '20以内退位减法') {
      const [a,b] = expression.split('−').map(Number);
      assert.ok(a > 10 && a < 20 && b < 10 && a % 10 < b, context);
    }
    if (unit.n === '100以内加法（进位）') {
      const [a,b] = expression.split('+').map(Number);
      assert.ok(a + b <= 100 && a % 10 + b % 10 >= 10, context);
    }
    if (unit.n === '100以内减法（退位）') {
      const [a,b] = expression.split('−').map(Number);
      assert.ok(a > b && a % 10 < b % 10, context);
    }
    checked++;
  }
  const fixed = { f: () => ['1 + 1', 2] };
  let counter = 0;
  const varied = { f: () => [`${++counter} + 2`, counter + 2] };
  assert.equal(buildPractice([fixed], 40).length, 1);
  assert.equal(buildPractice([fixed], 40, true).length, 40);
  const redistributed = buildPractice([fixed, varied], 40);
  assert.equal(redistributed.length, 40);
  assert.equal(new Set(redistributed.map(q => q[0])).size, 40);
  assert.equal(buildPractice([], 20).length, 0);
  assert.equal(buildPractice([{ f: () => undefined }, varied], 10).length, 10);
  const balanced = buildPractice([{ f: () => [`a${++counter}`, 1] }, { f: () => [`b${++counter}`, 2] }], 20);
  assert.equal(balanced.filter(q => q[0].startsWith('a')).length, 10);
  assert.equal(buildPractice([T[0]], 40).length, 20);
  for (let g = 1; g <= 6; g++) for (let t = 1; t <= 2; t++) {
    assert.equal(buildPractice(T.filter(u => u.g === g && u.t === t), 40).length, 40);
  }
  for (const [value, answer] of [['2/4','1/2'], ['.5','1/2'], [' 2 余 1 ','2…1'], ['2...1','2…1'], ['1：2','1:2'], ['50％','50%'], ['0.50','0.5']]) {
    assert.ok(answerMatches(value, answer), `${value} = ${answer}`);
  }
  for (const value of ['', ' ', '1/0', '0/0', 'Infinity', '0x10', '1e2', 'abc']) {
    assert.equal(parseAnswer(value), null, value);
    assert.equal(answerMatches(value, '0'), false, value);
  }
  assert.equal(answerMatches('2…2','2…1'), false);
  assert.equal(answerMatches('2:4','1:2'), false);
  assert.equal(answerMatches('50','50%'), false);
  const { getFeedback } = require('../js/feedback.js');
  for (const [correct,total,answered,kind] of [
    [10,10,10,'confetti'], [8,10,10,'applause'], [7,10,10,'cheer'],
    [6,10,10,'cheer'], [5,10,10,'comfort'], [0,10,10,'comfort'], [0,10,0,'ready']
  ]) assert.equal(getFeedback(correct,total,answered).kind,kind);
  assert.match(getFeedback(8,10,8).message,/还有 2 题没作答/);
  console.log(`通过：${T.length} 个单元、${checked} 道题（含方程、余数、比和百分数），组卷与判题边界测试。`);
} finally {
  Math.random = originalRandom;
}
