import { sdSets, centileSets } from '../datasets';

const indicatorConfigs = (female, displayType) => ({
  wfl: {
    title: 'Weight for Height',
    xtitle: 'Height (cm)',
    ytitle: 'Weight (kg)',
    dataSet:
      displayType === 'zscore'
        ? female ? sdSets.wflGirlsSd : sdSets.wflBoysSd
        : female ? centileSets.wflGirls : centileSets.wflBoys,
    measurement1: 'height', // replace string with corresponding data value string from config
    measurement2: 'weight' // replace string with corresponding data value string from config
  },
  wfa: {
    title: 'Weight for Age',
    xtitle: 'Age (months)',
    ytitle: 'Weight (kg)',
    dataSet:
      displayType === 'zscore'
        ? female ? sdSets.wfaGirlsSd : sdSets.wfaBoysSd
        : female ? centileSets.wfaGirls : centileSets.wfaBoys,
    ageBased: true,
    measurement1: 'ageInDays', // replace string with corresponding data value string from config
    measurement2: 'weight' // replace string with corresponding data value string from config
  },
  lhfa: {
    title: 'Height for Age',
    xtitle: 'Age (months)',
    ytitle: 'Height (cm)',
    dataSet:
      displayType === 'zscore'
        ? female ? sdSets.lhfaGirlsSd : sdSets.lhfaBoysSd
        : female ? centileSets.lhfaGirls : centileSets.lhfaBoys,
    ageBased: true,
    measurement1: 'ageInDays', // replace string with corresponding data value string from config
    measurement2: 'height' // replace string with corresponding data value string from config
  },
  bfa: {
    title: 'BMI for Age',
    xtitle: 'Age (months)',
    ytitle: 'BMI',
    dataSet:
      displayType === 'zscore'
        ? female ? sdSets.bfaGirlsSd : sdSets.bfaBoysSd
        : female ? centileSets.bfaGirls : centileSets.bfaBoys,
    ageBased: true,
    measurement1: 'ageInDays', // replace string with corresponding data value string from config
    measurement2: 'bmi' // replace string with corresponding data value string from config
  },
  acfa: {
    title: 'MUAC-for-age',
    xtitle: 'Age (months)',
    ytitle: 'MUAC',
    dataSet:
      displayType === 'zscore'
        ? female ? sdSets.acfaGirlsSd : sdSets.acfaBoysSd
        : female ? centileSets.acfaGirls : centileSets.acfaBoys,
    ageBased: true,
    measurement1: 'ageInDays', // replace string with corresponding data value string from config
    measurement2: 'muac' // replace string with corresponding data value string from config
  }
});

const getIndicatorConfig = (female, plotType, displayType) =>
  indicatorConfigs(female, displayType)[plotType];

export default getIndicatorConfig;
