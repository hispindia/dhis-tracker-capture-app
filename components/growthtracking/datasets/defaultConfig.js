const defaultColors = {
  SD0_1: '#BADA55',
  SD1_2: '#BADA55',
  SD2_3: '#dede32',
  SD3_4: '#ff7070'
};

const descriptions = {
  SD0_1: '0-1 Standard deviation range',
  SD1_2: '1-2 Standard deviation range',
  SD2_3: '2-3 Standard deviation range',
  SD3_4: '3+ Standard deviation range'
};

const defaultAnimation = {
  threshold: 1,
  speed: 1,
  radius: 1
};

const defaultIndicators = {
  wfl: true,
  wfa: true,
  lhfa: true,
  acfa: false,
  muac: true,
  bfa: false
};

const defaultAlerts = {
  wfl: 'Weight-for-length is at a dangerous level.',
  wfa: 'Weight-for-age is at a dangerous level.',
  lhfa: 'Length-for-age is at a dangerous level.',
  acfa: 'MUAC-for-age is at a dangerous level.',
  muac: 'MUAC is at a dangerous level.',
  bfa: 'BMI-for-age is at a dangerous level.'
};

const defaultConfig = {
  colors: defaultColors,
  scale: 1,
  display: 'z',
  animation: defaultAnimation,
  indicators: defaultIndicators,
  alerts: defaultAlerts,
  alertThreshold: 2
};

const validateConfig = config => {
  const {
    colors,
    scale,
    display,
    animation,
    indicators,
    alerts,
    alertThreshold
  } = config;

  if (
    Object.keys(config).length !== Object.keys(defaultConfig).length ||
    !colors ||
    !scale ||
    !display ||
    !animation
  )
    return false;

  if (
    Object.values(colors).length !== 4 ||
    !colors.SD0_1 ||
    !colors.SD1_2 ||
    !colors.SD2_3 ||
    !colors.SD3_4
  )
    return false;

  if (!Object.values(colors).every(color => typeof color === 'string'))
    return false;

  if (typeof scale !== 'number') return false;

  const validDisplay = { p: '-', z: '-', zp: '-', pz: '-' };
  if (!validDisplay[display]) return false;

  if (
    Object.values(animation).length !== 3 ||
    !animation.threshold ||
    !animation.speed ||
    !animation.radius
  )
    return false;

  if (!Object.values(animation).every(a => typeof a === 'number')) return false;

  if (
    !Object.values(indicators).every(
      indicator => typeof indicator === 'boolean'
    )
  )
    return false;

  if (!Object.values(alerts).every(alert => typeof alert === 'string'))
    return false;

  if (Object.values(alerts).length !== 6) return false;

  if (!alertThreshold) return false;

  if (alertThreshold && typeof alertThreshold !== 'number') return false;

  return true;
};

export {
  defaultColors,
  defaultAnimation,
  descriptions,
  defaultConfig,
  validateConfig
};
