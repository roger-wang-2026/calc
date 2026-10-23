// 成绩反馈：低分时也强调可执行的下一步，不给孩子贴标签。
function getFeedback(correct, total, answered = total) {
  if (!answered) return { kind: 'ready', emoji: '🌱', title: '先试一试吧！', message: '不用着急，从会做的一题开始，完成后再来检查。' };
  const rate = correct / total;
  let result;
  if (rate === 1) result = { kind: 'confetti', emoji: '🎉', title: '全对啦，给你撒花！', message: '每一道都算对了，认真思考的你真棒！休息一下，再来挑战新题吧。' };
  else if (rate >= .8) result = { kind: 'applause', emoji: '👏', title: '掌声送给你！', message: '大部分题目都掌握了！把剩下的题再仔细算一遍，离全对又近一步。' };
  else if (rate >= .6) result = { kind: 'cheer', emoji: '💪', title: '继续加油，你可以的！', message: '已经有不少题做对了！挑一道错题，慢慢写出计算步骤，再试一次。' };
  else result = { kind: 'comfort', emoji: '🥺', title: '有点难过也没关系，抱抱你', message: '一次练习不能代表你的能力。深呼吸，从一道简单的题开始；遇到困难也可以请老师或家长帮忙。' };
  if (answered < total) result = { ...result, message: `还有 ${total - answered} 题没作答，先把会做的补上吧！${result.message}` };
  return result;
}
if (typeof module !== 'undefined') module.exports = { getFeedback };
