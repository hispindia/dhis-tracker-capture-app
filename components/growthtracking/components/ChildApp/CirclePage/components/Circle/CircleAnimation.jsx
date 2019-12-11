import React from 'react';
import PropTypes from 'prop-types';

const CircleAnimation = ({ color, scale, speed }) => (
  <div
    style={{
      borderRadius: '100%',
      width: `${120 * scale}px`,
      height: `${120 * scale}px`,
      border: `${8 * scale}px solid ${color}`,
      margin: `auto auto auto ${
        (scale - 0.6) * 10 > 0 ? (scale - 0.6) * 10 : 0
      }px`,
      position: 'absolute',
      animation: `pulse ${1 * speed}s ease-out infinite`,
    }}
  />
);

CircleAnimation.propTypes = {
  color: PropTypes.string.isRequired,
  scale: PropTypes.number.isRequired,
  speed: PropTypes.number.isRequired,
};

export default CircleAnimation;
