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

const programIds = {
  childProgramId: 'c6RvWfvm3wl',
  motherProgramId: 'ibLaOIQtFDM'
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

const eventIds = {
  muac: 'SnQtKzhwOKw', // Needs to be in centimeters
  weight: 'JsRev4ChjQq', // Needs to be in kg
  height: 'GFSN50ohT0E' // Needs to be in cm
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
  firstname: 's8LMyJZmim8',
  lastname: 'ZOVsQef0rb8',
  gender: 'uSIz5uHBMdY', // Corresponding data element needs to be a string value "Male" or "Female"
  birthdate: 'twbKlJeT7bX'
};

export { programIds, eventIds, teiIds };
