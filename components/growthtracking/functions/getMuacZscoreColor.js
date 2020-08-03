const getZscoreColor = (colors, value) => {
  if (value >= 3) {
    return colors.SD3_4;
  }
  if (value >= 2) {
    return colors.SD2_3;
  }
  if (value >= 1) {
    return colors.SD1_2;
  }
  return colors.SD0_1;
};

const getMuacColor = (colors, muac) => {
  if (muac >= 13.5) {
    return colors.SD0_1;
  }
  if (muac >= 12.5) {
    return colors.SD1_2;
  }
  if (muac >= 11) {
    return colors.SD2_3;
  }
  return colors.SD3_4;
};

const getMuacZscoreColor = (colors, value, disabled, muac) => {
  if (disabled) {
    return '#ccc';
  }
  if (muac !== null) {
    return getMuacColor(colors, muac);
  }
  return getZscoreColor(colors, value);
};

export default getMuacZscoreColor;
