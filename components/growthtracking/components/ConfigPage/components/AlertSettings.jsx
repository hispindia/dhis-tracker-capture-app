import React from 'react';
import PropTypes from 'prop-types';

import { LabeledSlider } from './index';

class AlertSettings extends React.Component {
  render() {
    const { setAlertMessage, setAlertThreshold, config } = this.props;
    const { alerts, alertThreshold } = config;

    const thresholdMarks = {
      0: 'Disabled',
      0.5: '+-0.5 SD',
      1: '+-1 SD',
      1.5: '+-1.5 SD',
      2: '+-2 SD',
      2.5: '+-2.5 SD',
      3: '+-3 SD'
    };

    return (
      <div>
        <i>
          Here you change the alert messages for each indicator, and the
          standard deviation value at which they are triggered.
        </i>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <LabeledSlider
            label="Threshold"
            set={setAlertThreshold}
            value={alertThreshold}
            marks={thresholdMarks}
            min={0}
            max={3}
            style={{ marginTop: 30 }}
          />

          <div style={{ textAlign: 'center' }}>
            Weight-for-length:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="wfl-message"
              value={alerts.wfl}
              placeholder="WFL alert message"
              onChange={event => setAlertMessage('wfl', event.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            Weight-for-age:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="wfa-message"
              value={alerts.wfa}
              placeholder="WFA alert message"
              onChange={event => setAlertMessage('wfa', event.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            Length-for-age:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="lhfa-message"
              value={alerts.lhfa}
              placeholder="LHFA alert message"
              onChange={event => setAlertMessage('lhfa', event.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            BMI-for-age:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="bfa-message"
              value={alerts.bfa}
              placeholder="BFA alert message"
              onChange={event => setAlertMessage('bfa', event.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            MUAC-for-age:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="acfa-message"
              value={alerts.acfa}
              placeholder="ACFA alert message"
              onChange={event => setAlertMessage('acfa', event.target.value)}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            MUAC:
            <input
              style={{ height: '2.5rem', borderColor: '#ccc', width: '60%' }}
              type="text"
              name="muac-message"
              value={alerts.muac}
              placeholder="MUAC alert message"
              onChange={event => setAlertMessage('muac', event.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }
}

AlertSettings.propTypes = {
  setAlertMessage: PropTypes.func.isRequired,
  setAlertThreshold: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default AlertSettings;
