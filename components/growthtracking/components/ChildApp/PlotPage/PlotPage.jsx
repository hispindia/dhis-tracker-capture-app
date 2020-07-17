import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';
import HighchartsMore from 'highcharts-more';
import HighchartsExporting from 'highcharts-exporting';
import HighchartsOfflineExporting from 'highcharts-offline-exporting';

import { getIndicatorConfig, getPlotConfig } from '../../../functions';

HighchartsMore(ReactHighcharts.Highcharts);
HighchartsExporting(ReactHighcharts.Highcharts);
HighchartsOfflineExporting(ReactHighcharts.Highcharts);

const PlotPage = ({
  config,
  visits,
  plotType,
  setPlotType,
  displayType,
  setDisplayType,
  setShowMultiple,
  selectedVisit,
  patient,
  showMultiple,
  setVisit
}) => {
  const indicatorConfig = getIndicatorConfig(
    patient.gender,
    plotType,
    displayType
  );

  const plotConfig = getPlotConfig(
    indicatorConfig,
    config,
    visits,
    selectedVisit,
    plotType,
    displayType,
    showMultiple,
    setVisit
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div
          style={{
            fontSize: '1.3rem',
            margin: 6
          }}
        >
          Plot
        </div>

        <select
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            marginBottom: 0,
            fontSize: '14px',
            fontWeight: 'normal',
            lineHeight: '1.428571429',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
            cursor: 'pointer',
            borderRadius: 4,
            userSelect: 'none'
          }}
          value={plotType}
          onChange={setPlotType}
        >
          <option value="wfl">Weight-for-Height</option>
          <option value="wfa">Weight-for-age</option>
          <option value="lhfa">Height-for-age</option>
          <option value="bfa">BMI-for-age</option>
          <option value="acfa">MUAC-for-age</option>
        </select>

        <select
          style={{
            marginLeft: 20,
            marginRight: 20,
            display: 'inline-block',
            padding: '6px 12px',
            marginBottom: 0,
            fontSize: '14px',
            fontWeight: 'normal',
            lineHeight: '1.428571429',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
            cursor: 'pointer',
            borderRadius: 4,
            userSelect: 'none'
          }}
          value={displayType}
          onChange={setDisplayType}
        >
          <option value="zscore">Z-score</option>
          <option value="percentile">Percentile</option>
        </select>
        <div
          style={{
            fontSize: '1.3rem',
            margin: 6
          }}
        >
          Show
        </div>
        <select
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            marginBottom: 0,
            fontSize: '14px',
            fontWeight: 'normal',
            lineHeight: '1.428571429',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
            cursor: 'pointer',
            borderRadius: 4,
            userSelect: 'none'
          }}
          value={showMultiple}
          onChange={setShowMultiple}
        >
          <option value="multiple">Multiple points</option>
          <option value="single">Single-point</option>
        </select>

        <button
          onClick={() => setPlotType(null)}
          className="btn btn-primary small-horizontal-spacing"
        >
          Return
        </button>
      </div>

      <hr />

      <ReactHighcharts config={plotConfig} />
    </div>
  );
};

PlotPage.propTypes = {
  config: PropTypes.object.isRequired,
  visits: PropTypes.array.isRequired,
  setPlotType: PropTypes.func.isRequired,
  setShowMultiple: PropTypes.func.isRequired,
  setDisplayType: PropTypes.func.isRequired,
  displayType: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  selectedVisit: PropTypes.object.isRequired,
  patient: PropTypes.object.isRequired,
  showMultiple: PropTypes.string.isRequired,
  setVisit: PropTypes.func.isRequired
};

export default PlotPage;
