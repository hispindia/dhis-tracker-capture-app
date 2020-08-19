/**
 * Enter the program IDs for the program you want to use.
 *
 * If the child program ID is present and a child enrolled in the program is selected in the tracker,
 * the app calculates z-scores and generates plots based on the measurements.
 *
 * If the mother program ID is present and a mother enrolled in the program is selected in the tracker,
 * the app will present a simple trend chart.
 */

// old mapping

/*
const programIds = {
  childProgramId: 'U1xZvvCVWIM',
  motherProgramId: 'qbQ4TP1Yy3K'
};
*/

// new mapping for DMC INTPART

const programIds = {
  childProgramId: 'SSLpOM0r1U7'
};

/**
 * Here you can change the default event IDs that the program will search for.
 * The IDs need to correspond to each data value listed below.
 */

/* old mapping
const eventIds = {
  muac: 'ySphlmZ7fKG', // Needs to be in centimeters
  weight: 'KHyKhpRfVRS', // Needs to be in kg
  height: 'VCYJkaP96KZ' // Needs to be in cm
};
*/


/*
const eventIds = {
  muac: 'SnQtKzhwOKw', // Needs to be in centimeters
  weight: 'JsRev4ChjQq', // Needs to be in kg
  height: 'GFSN50ohT0E', // Needs to be in cm
  wfa: "sSbuKXKiYZN",  //z-score of WFA
  hfa: "Bc19GUIGdI0", //z-score of HFA
  wfh: "tdI91a7mv4j", //z-score of wfh
  bmi: "DHd4SEJ27pC", //bmi
};
*/


// new mapping for DMC-INTPART


const eventIds = {
  muac: 'yeeIKaqBxjq', // Needs to be in centimeters
  weight: 'bCLKDDwmxWe', // Needs to be in kg
  height: 'zvdn4impwpQ', // Needs to be in cm
  wfa: "j5RqPPaM7xb",  //z-score of WFA
  hfa: "qcykjdaSLd0", //z-score of HFA
  wfh: "CQKiEb71eQP", //z-score of wfh
  bmi: "cp110jDw81n", //bmi
};




/**
 * Here you can change the default tracked entity instance IDs that the program will search for.
 * The IDs need to correspond to each data value listed below.
 */

/* old mapping
const teiIds = {
  firstname: 'kim8r9m1oGE',
  lastname: 'blDEf5Ld0fA',
  gender: 'uMSSNRDVcXS', // Corresponding data element needs to be a string value "Male" or "Female"
  birthdate: 'yj8BaYdkTA6'
};
*/

const teiIds = {
  firstname: 'TfdH5KvFmMy',
  lastname: 'aW66s2QSosT',
  gender: 'PbEhJPnon0o', // Corresponding data element needs to be a string value "Male" or "Female"
  birthdate: 'iIf1gJ4FVdR'
};

export { programIds, eventIds, teiIds };
