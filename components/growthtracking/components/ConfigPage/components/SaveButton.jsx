import React from 'react';
import PropTypes from 'prop-types';

class SaveButton extends React.Component {
  render() {
    const { label, save } = this.props;

    return (
      <button
        onClick={save}
        className="btn btn-primary small-horizontal-spacing"
        style={{ float: 'right' }}
      >
        <i
          className="fa fa-save fa"
          style={{ fontSize: '18px' }}
          aria-hidden="true"
        />{' '}
        {label}
      </button>
    );
  }
}

SaveButton.propTypes = {
  save: PropTypes.func.isRequired,
  label: PropTypes.string,
};

SaveButton.defaultProps = {
  label: '',
};

export default SaveButton;
