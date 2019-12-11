const getSeries = (type, data, color) => ({
  type,
  data,
  lineWidth: 2,
  color,
  animation: false,
  fillOpacity: 1,
  enableMouseTracking: false,
  marker: {
    radius: 0
  },
  showInLegend: false
});

export default getSeries;
