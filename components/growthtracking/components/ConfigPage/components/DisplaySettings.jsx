import React from 'react';
import PropTypes from 'prop-types';

import { Circle } from '../../ChildApp/CirclePage/components';

const DisplaySettings = ({ setDisplay, config }) => {
  const { display } = config;

  return (
    <div>
      <i>
        Choose how the Z-score and percentile information should be displayed.
      </i>

      <div
        style={{
          marginTop: 30,
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        <Circle
          onClick={() => setDisplay('pz')}
          zscore={0.52}
          label="Percentile and Z-score"
          config={config}
          scale={0.8}
          display={'pz'}
          disabled={display !== 'pz'}
        />

        <Circle
          onClick={() => setDisplay('zp')}
          zscore={0.52}
          label="Z-score and Percentile"
          config={config}
          scale={0.8}
          display={'zp'}
          disabled={display !== 'zp'}
        />

        <Circle
          onClick={() => setDisplay('z')}
          zscore={0.52}
          label="Z-score"
          config={config}
          scale={0.8}
          display={'z'}
          disabled={display !== 'z'}
        />

        <Circle
          onClick={() => setDisplay('p')}
          zscore={0.52}
          label="Percentile"
          config={config}
          scale={0.8}
          display={'p'}
          disabled={display !== 'p'}
        />
      </div>
    </div>
  );
};

DisplaySettings.propTypes = {
  setDisplay: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default DisplaySettings;
