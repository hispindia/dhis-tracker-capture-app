import React from 'react';
import PropTypes from 'prop-types';

import { Circle } from '../../ChildApp/CirclePage/components';

const IndicatorSettings = ({ setIndicator, config }) => {
  const { indicators } = config;

  return (
    <div>
      <i>Choose what indicators to display.</i>

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
          onClick={() => setIndicator('wfl')}
          label="Weight-for-length"
          zscore={0.52}
          scale={0.8}
          config={config}
          disabled={!indicators.wfl}
        />

        <Circle
          onClick={() => setIndicator('wfa')}
          label="Weight-for-age"
          zscore={0.52}
          scale={0.8}
          config={config}
          disabled={!indicators.wfa}
        />

        <Circle
          onClick={() => setIndicator('lhfa')}
          label="Length-for-age"
          zscore={0.52}
          scale={0.8}
          config={config}
          disabled={!indicators.lhfa}
        />

        <Circle
          onClick={() => setIndicator('acfa')}
          label="MUAC-for-age"
          zscore={0.52}
          scale={0.8}
          config={config}
          disabled={!indicators.acfa}
        />

        <Circle
          onClick={() => setIndicator('bfa')}
          label="BMI-for-age"
          zscore={0.52}
          scale={0.8}
          config={config}
          disabled={!indicators.bfa}
        />

        <Circle
          onClick={() => setIndicator('muac')}
          label="MUAC"
          zscore={0.52}
          rdata={13.5}
          suffix="cm"
          scale={0.8}
          config={config}
          disabled={!indicators.muac}
        />
      </div>
    </div>
  );
};

IndicatorSettings.propTypes = {
  setIndicator: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default IndicatorSettings;
