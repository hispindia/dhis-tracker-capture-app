
const getMotherPlotConfig = (
  indicatorConfig,
  appConfig,
  visits
) => {
  if (!indicatorConfig) return null;

  const {
    xtitle,
    ytitle,
    measurement1,
    measurement2
  } = indicatorConfig;

  const patientVisits = visits.map(visit => [
    Date.parse(visit[measurement1]),
    visit[measurement2]
  ]);

  const d = new Date(patientVisits[0][0]);
  d.setDate(d.getDate() - 7);
  const plotStart = Date.parse(d);

  const t = new Date(visits[visits.length - 1].eventDate);
  t.setDate(t.getDate() + 7);
  const plotEnd = Date.parse(t);

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
      backgroundColor: 'white',

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
        }
      }
    },
    xAxis: {
      title: {
        text: xtitle
      },

      min: plotStart,
      max: plotEnd,

      maxPadding: 0.04,
      gridLineWidth: 0,
      tickInterval: 24 * 3600 * 1000 * 7,
      minorTickInterval: 24 * 3600 * 1000,
      minorTickPosition: 'outside',
      minorTickLength: 5,
      minorTickWidth: 1,
      minorGridLineWidth: 0,

      startOnTick: false,
      endOnTick: false,
      type: 'datetime',
      crosshair: true,
    },
    yAxis: {
      title: {
        text: ytitle
      },
      maxPadding: 0.04,
      gridLineWidth: 0,
      tickInterval: 0.5,
      minorTickInterval: 0.25,
      minorTickPosition: 'outside',
      minorTickLength: 5,
      minorTickWidth: 1,
      minorGridLineWidth: 0,

      startOnTick: false,
      endOnTick: false,
      crosshair: true,
    },
    tooltip: {
      formatter() {
        const visit = visits[this.point.index];
        const date = new Date(this.x).toISOString()
          .slice(0, 10);
        return `
                    <b>Visit: ${visit.index +
          1}</b> <br />
                    Date: ${date} <br />
                    ${ytitle}: ${this.y} <br />`
      }
    },
    series: [
      {
        data: patientVisits,
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
  };
};

export default getMotherPlotConfig;