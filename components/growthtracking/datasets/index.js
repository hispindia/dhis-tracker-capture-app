import wflBoysSd from './SD_Tables/wflBoysSd.js';
import wflGirlsSd from './SD_Tables/wflGirlsSd.js';
import wfaGirlsSd from './SD_Tables/wfaGirlsSd.js';
import wfaBoysSd from './SD_Tables/wfaBoysSd.js';
import lhfaGirlsSd from './SD_Tables/lhfaGirlsSd.js';
import lhfaBoysSd from './SD_Tables/lhfaBoysSd.js';
import acfaBoysSd from './SD_Tables/acfaBoysSd.js';
import acfaGirlsSd from './SD_Tables/acfaGirlsSd.js';
import bfaBoysSd from './SD_Tables/bfaBoysSd.js';
import bfaGirlsSd from './SD_Tables/bfaGirlsSd.js';

import wflBoys from './Centile_Tables/wflBoys.js';
import wflGirls from './Centile_Tables/wflGirls.js';
import wfaBoys from './Centile_Tables/wfaBoys.js';
import wfaGirls from './Centile_Tables/wfaGirls.js';
import lhfaGirls from './Centile_Tables/lhfaGirls.js';
import lhfaBoys from './Centile_Tables/lhfaBoys.js';
import acfaBoys from './Centile_Tables/acfaBoys.js';
import acfaGirls from './Centile_Tables/acfaGirls.js';
import bfaBoys from './Centile_Tables/bfaBoys.js';
import bfaGirls from './Centile_Tables/bfaGirls.js';

import { defaultConfig, descriptions } from './defaultConfig';

const sdSets = {
  wflBoysSd,
  wflGirlsSd,
  wfaBoysSd,
  wfaGirlsSd,
  lhfaGirlsSd,
  lhfaBoysSd,
  acfaBoysSd,
  acfaGirlsSd,
  bfaBoysSd,
  bfaGirlsSd
};

const centileSets = {
  wflBoys,
  wflGirls,
  wfaBoys,
  wfaGirls,
  lhfaGirls,
  lhfaBoys,
  acfaBoys,
  acfaGirls,
  bfaBoys,
  bfaGirls
};

export { sdSets, centileSets, defaultConfig, descriptions };
