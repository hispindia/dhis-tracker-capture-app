import React from 'react';
import PropTypes from 'prop-types';

import { VisitList, Circle, Alert } from '../ChildApp/CirclePage/components';
import MotherPlot from './MotherPlot.jsx';
import ConfigButton from '../ConfigButton.jsx';

class MotherCirclePage extends React.Component {
  state = {
    // Defaults to the most recent visit
    selectedVisit: this.props.visits[0],
    plotType: null,
    showMultiple: 'multiple'
  };

  setVisit = selectedVisit => {
    this.setState({ selectedVisit: this.props.visits[selectedVisit] });
  };

  setPlotType = event => {
    if (!event) {
      this.setState({ plotType: null });
      return;
    }
    this.setState({ plotType: event.target.value });
  };

  setShowMultiple = event =>
    this.setState({ showMultiple: event.target.value });

  togglePlot = plotType => this.setState({ plotType });

  render() {
    const { visits, toggleConfig, config, allowConfigUpdate } = this.props;
    const { selectedVisit, plotType } = this.state;

    const visit = selectedVisit;

    if (visit && plotType) {
      return (
        <MotherPlot
          config={config}
          visits={visits}
          setVisit={this.setVisit}
          plotType={plotType}
          setPlotType={this.setPlotType}
        />
      );
    }

    return (
      <div>
        <ConfigButton
          toggleConfig={toggleConfig}
          allowConfigUpdate={allowConfigUpdate}
        />

        <VisitList setVisit={this.setVisit} visits={visits} visit={visit} />

        <div
          style={{
            fontSize: 20,
            paddingLeft: 24,
            paddingTop: 24,
            paddingBottom: 24
          }}
        >
          Showing meassurements for visit {visit.index + 1} on{' '}
          {visit.eventDate.toISOString().slice(0, 10)}:{' '}
        </div>

        <Alert visit={visit} config={config} />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <Circle
            onClick={() => this.togglePlot('height')}
            label="Height"
            rdata={visit.height}
            suffix={'cm'}
            config={config}
            mother
          />
          <Circle
            onClick={() => this.togglePlot('weight')}
            label="Weight"
            rdata={visit.weight}
            suffix={'kg'}
            config={config}
            mother
          />
          <Circle
            onClick={() => this.togglePlot('muac')}
            label="MUAC"
            rdata={visit.muac}
            suffix={'cm'}
            config={config}
            mother
          />
        </div>
      </div>
    );
  }
}

MotherCirclePage.propTypes = {
  visits: PropTypes.arrayOf(PropTypes.object),
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired,
  toggleConfig: PropTypes.func.isRequired,
  allowConfigUpdate: PropTypes.bool.isRequired
};

MotherCirclePage.defaultProps = {
  visits: []
};

export default MotherCirclePage;
