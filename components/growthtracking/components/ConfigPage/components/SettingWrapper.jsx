import React from 'react';
import PropTypes from 'prop-types';

import { RestoreButton } from '../components';

class SettingWrapper extends React.Component {
  state = {
    showPanel: false,
  };

  toggleShowPanel = () =>
    this.setState(state => ({ showPanel: !state.showPanel }));

  render() {
    const { title, SettingComponent, restoreDefault } = this.props;
    const { showPanel } = this.state;

    return (
      <div>
        <div
          onClick={this.toggleShowPanel}
          role="button"
          tabIndex="0"
          style={{
            display: 'flex',
            flexDirection: 'row',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <div style={{ flex: '1' }} className="title small-vertical-spacing">
            {title}
          </div>

          <i
            style={{ fontSize: '2rem' }}
            className={`fa fa-chevron-${showPanel ? 'up' : 'down'}`}
            aria-hidden="true"
          />
        </div>
        {showPanel && (
          <div>
            {SettingComponent}
            <RestoreButton restoreDefault={restoreDefault} />
          </div>
        )}
      </div>
    );
  }
}

SettingWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  SettingComponent: PropTypes.object.isRequired,
  restoreDefault: PropTypes.func.isRequired,
};

export default SettingWrapper;
