import React from 'react';
import PropTypes from 'prop-types';

class ReturnButton extends React.Component {
  render() {
    const { toggleConfig } = this.props;

    return (
      <button
        onClick={toggleConfig}
        className="btn btn-primary small-horizontal-spacing"
        style={{ float: 'right' }}
      >
        Return
      </button>
    );
  }
}

ReturnButton.propTypes = {
  toggleConfig: PropTypes.func.isRequired,
};

export default ReturnButton;
