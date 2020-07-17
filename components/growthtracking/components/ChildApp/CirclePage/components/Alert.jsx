import React from 'react';
import PropTypes from 'prop-types';

class Alert extends React.Component {
  state = {
    displayAlert: true
  };

  componentWillUpdate(nextProps) {
    if (this.props.visit.index !== nextProps.visit.index) {
      this.resetAlert();
    }
  }

  getAlerts = (visit, config) => {
    const { indicators, alerts, alertThreshold } = config;

    if (alertThreshold === 0) return [];

    const message = [];
    if (indicators.wfl && Math.abs(visit.wfl) >= alertThreshold) {
      message.push(alerts.wfl);
    }
    if (indicators.wfa && Math.abs(visit.wfa) >= alertThreshold) {
      message.push(alerts.wfa);
    }
    if (indicators.lhfa && Math.abs(visit.lhfa) >= alertThreshold) {
      message.push(alerts.lhfa)
    }
    if (indicators.muac && Math.abs(visit.muac) < 12.5) {
      message.push(alerts.muac);
    }
    if (indicators.bfa && Math.abs(visit.bfa) >= alertThreshold) {
      message.push(alerts.bfa);
    }
    if (indicators.acfa && Math.abs(visit.acfa) >= alertThreshold) {
      message.push(alerts.acfa);
    }
    return message;
  };

  toggleAlert = () =>
    this.setState(state => ({ displayAlert: !state.displayAlert }));

  resetAlert = () => this.setState({ displayAlert: true });

  render() {
    const { visit, config } = this.props;
    const { displayAlert } = this.state;

    const alertMessage = this.getAlerts(visit, config);

    if (!displayAlert || alertMessage.length === 0) return null;

    return (
      <div className="alert alert-danger">
        <button
          style={{
            border: 'none',
            padding: 0,
            background: 'none',
            fontWeight: 'bold',
            float: 'right'
          }}
          onClick={this.toggleAlert}
        >
          X
        </button>
        {alertMessage.map(message => (
          <div style={{ fontSize: '1.3rem' }} key={Math.random()}>
            {message}
          </div>
        ))}
      </div>
    );
  }
}

Alert.propTypes = {
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired,
  visit: PropTypes.object.isRequired
};

export default Alert;
