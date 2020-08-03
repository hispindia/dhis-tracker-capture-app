const getDeviations = (dataSet, displayType) => {
  if (displayType === 'zscore') {
    return Object.entries(dataSet).reduce(
      (acc, value) => ({
        SD4_SD3: [
          ...acc.SD4_SD3,
          [Number(value[0]), value[1].SD4, value[1].SD3]
        ],
        SD3_SD2: [
          ...acc.SD3_SD2,
          [Number(value[0]), value[1].SD3, value[1].SD2]

        ],
        SD2_SD1: [
          ...acc.SD2_SD1,
          [Number(value[0]), value[1].SD2, value[1].SD1]

        ],
        SD1_SD0: [
          ...acc.SD1_SD0,
          [Number(value[0]), value[1].SD1, value[1].SD0]
        ],
        SD0_nSD1: [
          ...acc.SD0_nSD1,
          [Number(value[0]), value[1].SD0, value[1].SD1neg]
        ],
        nSD1_nSD2: [
          ...acc.nSD1_nSD2,
          [Number(value[0]), value[1].SD1neg, value[1].SD2neg]
        ],
        nSD2_nSD3: [
          ...acc.nSD2_nSD3,
          [Number(value[0]), value[1].SD2neg, value[1].SD3neg]
        ],
        nSD3_nSD4: [
          ...acc.nSD3_nSD4,
          [Number(value[0]), value[1].SD3neg, value[1].SD4neg]
        ],
        SD0: [...acc.SD0, [Number(value[0]), value[1].SD0]]
      }),
      {
        SD4_SD3: [],
        SD3_SD2: [],
        SD2_SD1: [],
        SD1_nSD1: [],
        SD1_SD0: [],
        SD0_nSD1: [],
        nSD1_nSD2: [],
        nSD2_nSD3: [],
        nSD3_nSD4: [],
        SD0: []
      }
    );
  }
  return Object.entries(dataSet).reduce(
    (acc, value) => ({
      P01: [
        ...acc.P01,
        [Number(value[0]), value[1].P01, value[1].P3]
      ],
      P3: [
        ...acc.P3,
        [Number(value[0]), value[1].P3, value[1].P15]
      ],
      P15: [
        ...acc.P15,
        [Number(value[0]), value[1].P15, value[1].P85]
      ],
      P50: [...acc.P50, [Number(value[0]), value[1].P50]],
      P85: [
        ...acc.P85,
        [Number(value[0]), value[1].P85, value[1].P97]
      ],
      P97: [
        ...acc.P97,
        [Number(value[0]), value[1].P97, value[1].P999]
      ],
    }),
    {
      P01: [],
      P3: [],
      P15: [],
      P50: [],
      P85: [],
      P97: [],
    }
  );
};

export default getDeviations;
