import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';
import HighchartsMore from 'highcharts-more';
import HighchartsExporting from 'highcharts-exporting';
import HighchartsOfflineExporting from 'highcharts-offline-exporting';
import { getMotherPlotConfig } from '../../functions/index';

HighchartsMore(ReactHighcharts.Highcharts);
HighchartsExporting(ReactHighcharts.Highcharts);
HighchartsOfflineExporting(ReactHighcharts.Highcharts);

const getMotherIndicatorConfig = () => ({
  height: {
    title: 'Height',
    xtitle: 'Visits',
    ytitle: 'Height',
    measurement1: 'eventDate',
    measurement2: 'height'
  },
  weight: {
    title: 'Weight',
    xtitle: 'Visits',
    ytitle: 'Weight',
    measurement1: 'eventDate',
    measurement2: 'weight'
  },
  muac: {
    title: 'MUAC',
    xtitle: 'Visits',
    ytitle: 'MUAC',
    measurement1: 'eventDate',
    measurement2: 'muac'
  }
});

const MotherPlot = ({
  config,
  visits,
  plotType,
  setPlotType
}) => {
  const indicatorConfig = getMotherIndicatorConfig()[plotType];

  const plotConfig = getMotherPlotConfig(
    indicatorConfig,
    config,
    visits,
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
          <option value="height">Height</option>
          <option value="weight">Weight</option>
          <option value="muac">MUAC</option>
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


MotherPlot.propTypes = {
  config: PropTypes.object.isRequired,
  visits: PropTypes.array.isRequired,
  setPlotType: PropTypes.func.isRequired,
  plotType: PropTypes.string.isRequired
};

export default MotherPlot;

