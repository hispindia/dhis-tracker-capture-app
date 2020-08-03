import React from 'react';
import PropTypes from 'prop-types';

import CircleAnimation from './CircleAnimation.jsx';

import { getCentile, getMuacZscoreColor } from '../../../../../functions';
import * as circleStyles from './circleStyles.jsx';

class Circle extends React.Component {
  state = {
    hovered: false
  };

  getColor = (colors, absoluteValue, disabled, rdata, mother) => {
    if (mother) {
      return '#928c8c';
    }
    return getMuacZscoreColor(colors, absoluteValue, disabled, rdata);
  };

  toggleHover = value => this.setState({ hovered: value });

  render() {
    const {
      onClick,
      zscore,
      rdata,
      suffix,
      label,
      config,
      disabled,
      mother,
      ...rest
    } = this.props;

    const { hovered } = this.state;

    const { colors } = config;
    const scale = rest.scale || config.scale;
    const display = rest.display || config.display;
    const threshold = rest.threshold || config.animation.threshold;

    const absoluteValue = Math.abs(zscore);
    const color = this.getColor(colors, absoluteValue, disabled, rdata, mother);
    const percentile = getCentile(zscore);

    const animated = !disabled && threshold !== 0 && absoluteValue >= threshold;

    if (zscore === null && rdata === null) {
      return null;
    }

    return (
      <button
        // Circle container style
        style={{
          height: `${150 * scale}px`,
          width: `${140 * scale}px`,
          marginRight: `${20 * scale}px`,
          marginLeft: `${20 * scale}px`,
          marginBottom: label ? `${20 * scale}px` : 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          cursor: onClick ? 'pointer' : 'unset'
        }}
        onClick={onClick}
        onMouseEnter={() => this.toggleHover(true)}
        onMouseLeave={() => this.toggleHover(null)}
      >
        {animated && (
          <CircleAnimation
            color={color}
            scale={scale}
            speed={config.animation.speed}
          />
        )}

        <div
          // Circle style
          style={{
            borderRadius: '100%',
            width: `${120 * scale}px`,
            height: `${120 * scale}px`,
            border: `${8 * scale}px solid ${color}`,
            margin: 'auto',
            backgroundColor: hovered ? color : 'white'
          }}
        >
          {circleStyles[display](
            scale,
            color,
            zscore,
            percentile,
            hovered,
            rdata,
            suffix
          )}
        </div>
        {label && (
          <div
            // Label style
            style={{ textAlign: 'center', fontSize: `${1.3 * scale}rem` }}
            className="title small-vertical-spacing"
          >
            {label}
          </div>
        )}
      </button>
    );
  }
}

Circle.propTypes = {
  onClick: PropTypes.func,
  zscore: PropTypes.number,
  rdata: PropTypes.number,
  suffix: PropTypes.string,
  label: PropTypes.string,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.number])
  ).isRequired,
  disabled: PropTypes.bool
};

Circle.defaultProps = {
  label: null,
  zscore: null,
  rdata: null,
  suffix: null,
  onClick: null,
  disabled: false
};

export default Circle;
