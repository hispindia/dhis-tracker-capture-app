import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';

const LabeledSlider = ({ label, set, value, marks, min, max, style }) => (
  <div style={style}>
    <div
      className="title small-vertical-spacing"
      style={{ fontSize: '1.2rem' }}
    >
      {label}
    </div>
    <Slider
      min={min}
      max={max}
      marks={marks}
      step={0.05}
      onChange={set}
      defaultValue={value}
      value={value}
      trackStyle={{ height: 10 }}
      handleStyle={{
        height: 20,
        width: 20,
        marginTop: -5,
      }}
      railStyle={{
        height: 10,
      }}
      dotStyle={{
        height: 14,
        width: 14,
        marginLeft: -5,
        bottom: -8,
      }}
      style={{
        width: '80%',
        margin: 'auto',
        marginTop: 10,
        marginBottom: 30,
      }}
    />
  </div>
);

LabeledSlider.propTypes = {
  label: PropTypes.string.isRequired,
  set: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
  marks: PropTypes.object.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default LabeledSlider;
