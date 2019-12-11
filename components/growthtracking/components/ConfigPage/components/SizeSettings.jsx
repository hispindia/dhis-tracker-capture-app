import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';

import { Circle } from '../../ChildApp/CirclePage/components';

const SizeSettings = ({ setScale, config }) => {
  const { scale } = config;
  const marks = {
    0.5: '50%',
    0.75: '75%',
    1.0: 'Default',
    1.25: '125%',
    1.5: '150%'
  };

  return (
    <div>
      <i>Edit the size of the circle display.</i>

      <Slider
        min={0.5}
        max={1.5}
        marks={marks}
        step={0.05}
        onChange={setScale}
        defaultValue={scale}
        value={scale}
        trackStyle={{ height: 10 }}
        handleStyle={{
          height: 20,
          width: 20,
          marginTop: -5
        }}
        railStyle={{
          height: 10
        }}
        dotStyle={{
          height: 14,
          width: 14,
          marginLeft: -5,
          bottom: -8
        }}
        style={{
          width: '80%',
          margin: 'auto',
          marginTop: 30,
          marginBottom: 30
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        <Circle
          zscore={0.5}
          label={`${Math.round(scale * 100)}%`}
          config={config}
        />
      </div>
    </div>
  );
};

SizeSettings.propTypes = {
  setScale: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default SizeSettings;
