const getCentile = zscore => {
  if (zscore === null) return null;

  const absoluteZscore = Math.abs(zscore);

  const k = 1 / (1 + 0.2316419 * absoluteZscore);
  const z = 1 / Math.sqrt(2 * Math.PI) * Math.exp(-(absoluteZscore ** 2) / 2);

  const centile =
    1 -
    z *
      (0.31938153 * k +
        -0.356563782 * k ** 2 +
        1.781477937 * k ** 3 +
        -1.821255978 * k ** 4 +
        1.330274429 * k ** 5);

  if (zscore > 0) {
    return Math.round(centile * 100 * 10) / 10;
  }

  return Math.round((100 - centile * 100) * 10) / 10;
};

export default getCentile;
