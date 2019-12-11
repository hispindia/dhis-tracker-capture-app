import React from 'react';
import PropTypes from 'prop-types';

import ConfigPage from './components/ConfigPage';
import ChildApp from './components/ChildApp';
import MotherApp from './components/MotherApp';

import { defaultConfig, validateConfig } from './datasets/defaultConfig';
import { programIds } from './constants';

class App extends React.Component {
  state = {
    showConfig: false,
    config: {
      ...this.props.initialConfig
    }
  };

  componentWillMount() {
    if (!validateConfig(this.props.initialConfig)) {
      // TODO: Display DHIS modal to inform the user that the configuration was invalid and was reverted to default
      this.saveConfig(defaultConfig);
    }
  }

  saveConfig = config => {
    // TODO: Prevent save if no change
    // TODO: Add feedback when saving
    this.props.updateConfig('growthTracker', 'config', config);

    this.setState({
      config
    });
  };

  addAnimation = radius => {
    const keyframesStyle = `
        @-webkit-keyframes pulse {
          0% {-webkit-transform: scale(1, 1); opacity: 1.0;}
          100% {-webkit-transform: scale(${1.2 * radius}, ${1.2 *
      radius}); opacity: 0.0;}
        }`;
    const styleElement = document.createElement('style');

    document.head.appendChild(styleElement);

    styleElement.sheet.insertRule(
      keyframesStyle,
      styleElement.sheet.cssRules.length
    );
  };

  toggleConfig = () =>
    this.setState(state => ({ showConfig: !state.showConfig }));

  render() {
    const { events, trackedEntity, program, allowConfigUpdate } = this.props;
    const { config } = this.state;

    // No valid program found.
    if (
      program !== programIds.childProgramId &&
      program !== programIds.motherProgramId
    )
      return null;

    this.addAnimation(
      config.animation.radius || defaultConfig.animation.radius
    );

    if (this.state.showConfig) {
      return (
        <ConfigPage
          config={config}
          toggleConfig={this.toggleConfig}
          saveConfig={this.saveConfig}
          addAnimation={this.addAnimation}
        />
      );
    }

    if (program === programIds.motherProgramId) {
      return (
        <MotherApp
          trackedEntity={trackedEntity}
          events={events}
          toggleConfig={this.toggleConfig}
          allowConfigUpdate={allowConfigUpdate}
          config={config}
        />
      );
    }

    return (
      <ChildApp
        trackedEntity={trackedEntity}
        events={events}
        toggleConfig={this.toggleConfig}
        allowConfigUpdate={allowConfigUpdate}
        config={config}
      />
    );
  }
}

App.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  trackedEntity: PropTypes.object.isRequired,
  program: PropTypes.string.isRequired,
  updateConfig: PropTypes.func.isRequired,
  initialConfig: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired,
  allowConfigUpdate: PropTypes.bool.isRequired
};

export default App;
