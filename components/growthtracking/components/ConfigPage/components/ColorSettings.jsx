import React from 'react';
import PropTypes from 'prop-types';
import { ChromePicker } from 'react-color';

import { descriptions } from '../../../datasets';
import { Circle } from '../../ChildApp/CirclePage/components';

class ColorSettings extends React.Component {
  state = {
    show: {
      ...Object.keys(this.props.config.colors).reduce((acc, value) => {
        acc[value] = false;
        return acc;
      }, {})
    }
  };

  toggleShow = id => {
    this.setState(state => ({
      show: { ...state.show, [id]: !state.show[id] }
    }));
  };

  render() {
    const { setColor, config } = this.props;
    const { colors } = config;
    const { show } = this.state;

    return (
      <div>
        <i>
          Click a circle to change the color representation of the standard
          deviation range.
        </i>
        <div
          style={{
            marginTop: 30,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {Object.keys(colors).map((id, index) => (
            <div
              key={id}
              style={{
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                margin: 20,
                marginTop: 0
              }}
            >
              <b>{descriptions[id]}</b>

              <Circle
                index={index}
                onClick={() => this.toggleShow(id)}
                zscore={index}
                config={config}
                scale={0.8}
              />

              {show[id] ? (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 2
                  }}
                >
                  <div
                    style={{
                      position: 'fixed',
                      top: '0px',
                      right: '0px',
                      bottom: '0px',
                      left: '0px'
                    }}
                    onClick={() => this.toggleShow(id)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      zIndex: 2,
                      top: 130,
                      left: -50
                    }}
                  >
                    <ChromePicker
                      color={colors[id]}
                      onChange={c => setColor(id, c.hex)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

ColorSettings.propTypes = {
  setColor: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default ColorSettings;
