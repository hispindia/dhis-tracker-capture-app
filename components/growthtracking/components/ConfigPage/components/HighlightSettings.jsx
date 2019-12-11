import React from 'react';
import PropTypes from 'prop-types';
import 'rc-slider/assets/index.css';

import { Circle } from '../../ChildApp/CirclePage/components';
import { LabeledSlider } from './index';

const HighlightSettings = ({ setThreshold, setSpeed, setRadius, config }) => {
  const { threshold, speed, radius } = config.animation;

  const thresholdMarks = {
    0: 'Disabled',
    0.5: '0.5 SD',
    1: 'Default',
    1.5: '1.5 SD',
    2: '2 SD',
    2.5: '2.5 SD',
    3: '3 SD'
  };

  const speedMarks = {
    0.05: 'Faster',
    1.0: 'Default',
    2: 'Slower'
  };

  const radiusMarks = {
    1.0: 'Default',
    1.3: 'Bigger'
  };

  return (
    <div>
      <i>
        Set the minimum standard deviation threshold for when the highlighting
        animation should be enabled.
      </i>

      <LabeledSlider
        label="Threshold"
        set={setThreshold}
        value={threshold}
        marks={thresholdMarks}
        min={0}
        max={3}
        style={{ marginTop: 30 }}
      />

      <LabeledSlider
        label="Animation speed"
        set={setSpeed}
        value={speed}
        marks={speedMarks}
        min={0.05}
        max={2}
      />

      <LabeledSlider
        label="Animation radius"
        set={setRadius}
        value={radius}
        marks={radiusMarks}
        min={1}
        max={1.3}
      />

      <div className="title small-vertical-spacing">Demo:</div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        <Circle zscore={0.5} config={config} scale={0.8} />

        <Circle zscore={1.5} config={config} scale={0.8} />

        <Circle zscore={2.5} config={config} scale={0.8} />
        <Circle zscore={3.5} config={config} scale={0.8} />
      </div>
    </div>
  );
};

HighlightSettings.propTypes = {
  setSpeed: PropTypes.func.isRequired,
  setThreshold: PropTypes.func.isRequired,
  setRadius: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default HighlightSettings;
