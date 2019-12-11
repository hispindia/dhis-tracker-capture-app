import React from 'react';
import PropTypes from 'prop-types';

class RestoreButton extends React.Component {
  render() {
    const { restoreDefault, label } = this.props;

    return (
      <button
        onClick={restoreDefault}
        className="btn btn-primary small-horizontal-spacing"
        style={{ float: 'right', marginBottom: 10 }}
      >
        {label}
      </button>
    );
  }
}

RestoreButton.propTypes = {
  label: PropTypes.string,
  restoreDefault: PropTypes.func.isRequired,
};

RestoreButton.defaultProps = {
  label: 'Default',
};

export default RestoreButton;
