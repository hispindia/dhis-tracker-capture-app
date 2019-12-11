import { getCentile, getDeviations, getSeries } from '../functions';

const getDataSeries = (displayType, deviations, colors) => {
  if (displayType === 'zscore') {
    return [
      getSeries('arearange', deviations.SD4_SD3, colors.SD3_4, true),
      getSeries('arearange', deviations.SD3_SD2, colors.SD2_3, true),
      getSeries('arearange', deviations.SD2_SD1, colors.SD1_2, true),
      getSeries('arearange', deviations.SD1_SD0, colors.SD0_1),
      getSeries('arearange', deviations.SD0_nSD1, colors.SD0_1),
      getSeries('arearange', deviations.nSD1_nSD2, colors.SD1_2),
      getSeries('arearange', deviations.nSD2_nSD3, colors.SD2_3),
      getSeries('arearange', deviations.nSD3_nSD4, colors.SD3_4),
      getSeries('line', deviations.SD0, colors.SD3_4, true)
    ];
  }
  return [
    getSeries('arearange', deviations.P01, colors.SD2_3),
    getSeries('arearange', deviations.P3, colors.SD1_2),
    getSeries('arearange', deviations.P15, colors.SD0_1),
    getSeries('arearange', deviations.P85, colors.SD1_2),
    getSeries('arearange', deviations.P97, colors.SD2_3),
    getSeries('line', deviations.P50, colors.SD0_1)
  ];
};

const getSerieLabel = (label, SDcolor) => ({
  color: SDcolor,
  name: label,
  marker: {
    enabled: false
  }
});

const getSeriesLables = (displayType, colors) => {
  if (displayType === 'zscore') {
    return [
      getSerieLabel('Median', colors.SD3_4),
      getSerieLabel('SD +/- 2-3', colors.SD2_3),
      getSerieLabel('SD +/- 1-2', colors.SD1_2),
      getSerieLabel('SD +/- 0-1', colors.SD0_1)
    ];
  }
  return [
    getSerieLabel('3rd', colors.SD2_3),
    getSerieLabel('15th', colors.SD1_2),
    getSerieLabel('50th', colors.SD0_1),
    getSerieLabel('85th', colors.SD1_2),
    getSerieLabel('97th', colors.SD2_3)
  ];
};

const getPlotConfig = (
  indicatorConfig,
  appConfig,
  visits,
  selectedVisit,
  plotType,
  displayType,
  showMultiple,
  setVisit
) => {
  if (!indicatorConfig) return null;

  const { colors } = appConfig;
  const {
    ageBased,
    dataSet,
    xtitle,
    ytitle,
    measurement1,
    measurement2
  } = indicatorConfig;

  const deviations = getDeviations(dataSet, displayType);

  const patientVisits = visits.map(visit => [
    visit[measurement1],
    visit[measurement2]
  ]);
  const patientVisit = [
    [selectedVisit[measurement1], selectedVisit[measurement2]]
  ];

  const formatDivisor = ageBased ? 30.25 : 1;
  const minorFormatDivisor = ageBased ? 30.25 / 2 : 1;

  return {
    title: {
      text: indicatorConfig.title,
      x: 0
    },
    chart: {
      zoomType: 'xy',
      resetZoomButton: {
        position: {
          x: -40,
          y: 10
        }
      },
      backgroundColor: 'white'
    },
    exporting: {
      fallbackToExportServer: false
    },
    credits: false,
    plotOptions: {
      scatter: {
        lineWidth: 2
      },
      marker: {
        enabled: false
      },
      series: {
        animation: false,
        // Prevent user from disabling series through clicking the legend
        events: {
          legendItemClick(e) {
            e.preventDefault();
          },
          click(e) {
            const index = this.xData.indexOf(e.point.x);
            setVisit(index);
          }
        }
      }
    },
    xAxis: {
      maxPadding: 0.04,
      gridLineWidth: 0,
      tickInterval: formatDivisor,
      minorTickInterval: minorFormatDivisor,
      minorTickPosition: 'outside',
      minorTickLength: 5,
      minorTickWidth: 1,
      minorGridLineWidth: 0,

      labels: {
        formatter() {
          // if chart is based on age, divide days by 30.25 to get months
          return Math.round(this.value / formatDivisor);
        }
      },
      title: {
        text: xtitle
      },
      plotLines: [
        {
          color: 'red',
          width: 1,
          value: selectedVisit[measurement1],
          dashStyle: 'shortdash',
          zIndex: 4
        }
      ]
    },
    yAxis: {
      gridLineWidth: 0,
      maxPadding: 0.08,
      tickInterval: 1,
      tickWidth: 1,
      minorTickInterval: 1,
      minorTickLength: 5,
      minorTickWidth: 1,
      minorGridLineWidth: 0,

      title: {
        text: ytitle
      },
      plotLines: [
        {
          color: 'red',
          width: 1,
          value: selectedVisit[measurement2],
          dashStyle: 'shortdash',
          zIndex: 4
        }
      ]
    },
    tooltip: {
      formatter() {
        const x = ageBased
          ? Math.round(this.x / formatDivisor)
          : Math.round(this.x * 100) / 100;
        const y = Math.round(this.y * 100) / 100;

        if (showMultiple === 'multiple') {
          const visit = visits[this.point.index];
          const zscore = visit[plotType];

          return `
                    <b>${visit.index +
                      1}: ${visit.eventDate
            .toISOString()
            .slice(0, 10)}</b> <br />
                    ${xtitle}: ${x} <br />
                    ${ytitle}: ${y} <br />
                    Z-score: ${zscore} <br />
                    Percentile: ${getCentile(zscore)}%`;
        }

        const zscore = selectedVisit[plotType];

        return `
          <b>${selectedVisit.index +
            1}: ${selectedVisit.eventDate.toISOString().slice(0, 10)}</b> <br />
          ${xtitle}: ${x} <br />
          ${ytitle}: ${y} <br />
          Z-score: ${zscore} <br />
          Percentile: ${getCentile(zscore)}%`;
      }
    },
    series: [
      // This is an empty series that adds the plotline to the legend.
      {
        color: '#FF0000',
        name: `Age: ${Math.round(selectedVisit.ageInDays / 30.25)} months, ${
          displayType === 'zscore'
            ? `Z-score: ${selectedVisit[plotType]}`
            : `Percentile: ${getCentile(selectedVisit[plotType])}%`
        }`,
        dashStyle: 'shortdash',
        marker: {
          enabled: false
        }
      },
      ...getSeriesLables(displayType, colors),
      ...getDataSeries(displayType, deviations, colors),
      {
        data: showMultiple === 'multiple' ? patientVisits : patientVisit,
        marker: {
          symbol: 'circle'
        },
        color: '#428bca',
        lineWidth: 2,
        name: 'Patient',
        zIndex: 5,
        showInLegend: false
      }
    ],
    legend: {
      align: 'left',
      verticalAlign: 'top',
      x: 70,
      y: 30,
      floating: true,
      layout: 'vertical',
      borderColor: '#c3c3c3',
      borderWidth: 1,
      backgroundColor: 'white'
    }
  };
};

export default getPlotConfig;
