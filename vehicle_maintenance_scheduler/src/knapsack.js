function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function solveKnapsack(items, capacity) {
  const maxCapacity = Math.max(0, Math.floor(toNumber(capacity)));
  const normalizedItems = items.map((item) => ({
    id: item.id,
    duration: Math.max(0, Math.floor(toNumber(item.duration))),
    impact: Math.max(0, toNumber(item.impact)),
  }));

  const count = normalizedItems.length;
  const dp = Array.from({ length: count + 1 }, () => Array(maxCapacity + 1).fill(0));
  const dpDuration = Array.from({ length: count + 1 }, () => Array(maxCapacity + 1).fill(0));
  const keep = Array.from({ length: count + 1 }, () => Array(maxCapacity + 1).fill(false));

  for (let i = 1; i <= count; i += 1) {
    const { duration, impact } = normalizedItems[i - 1];

    for (let cap = 0; cap <= maxCapacity; cap += 1) {
      if (duration <= cap) {
        const take = impact + dp[i - 1][cap - duration];
        const skip = dp[i - 1][cap];

        const takeDuration = dpDuration[i - 1][cap - duration] + duration;
        const skipDuration = dpDuration[i - 1][cap];

        if (take > skip) {
          dp[i][cap] = take;
          dpDuration[i][cap] = takeDuration;
          keep[i][cap] = true;
        } else if (take === skip && takeDuration < skipDuration) {
          dp[i][cap] = take;
          dpDuration[i][cap] = takeDuration;
          keep[i][cap] = true;
        } else {
          dp[i][cap] = skip;
          dpDuration[i][cap] = skipDuration;
        }
      } else {
        dp[i][cap] = dp[i - 1][cap];
        dpDuration[i][cap] = dpDuration[i - 1][cap];
      }
    }
  }

  const selected = [];
  let cap = maxCapacity;

  for (let i = count; i >= 1; i -= 1) {
    if (keep[i][cap]) {
      const chosen = normalizedItems[i - 1];
      selected.unshift(chosen);
      cap -= chosen.duration;
    }
  }

  return {
    totalImpact: dp[count][maxCapacity],
    selected,
  };
}

module.exports = {
  solveKnapsack,
};
