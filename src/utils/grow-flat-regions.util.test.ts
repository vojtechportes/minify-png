import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import { growFlatRegions } from './grow-flat-regions.util';

describe('growFlatRegions', () => {
  it('merges adjacent compatible seeds into one accepted region', () => {
    const result = growFlatRegions(
      [
        {
          id: 1,
          x: 0,
          y: 0,
          width: 8,
          height: 8,
          tileX: 0,
          tileY: 0,
          representative: [100, 100, 100, 255],
          pixelIndexes: [0, 1, 2, 3],
          p95Distance: 1,
          maxDistance: 1,
          alphaRange: 0,
        },
        {
          id: 2,
          x: 8,
          y: 0,
          width: 8,
          height: 8,
          tileX: 1,
          tileY: 0,
          representative: [102, 102, 102, 255],
          pixelIndexes: [4, 5, 6, 7],
          p95Distance: 1,
          maxDistance: 1,
          alphaRange: 0,
        },
      ],
      4,
      2,
      {
        ...defaultMinifyPngOptions,
        minRegionArea: 4,
        minRegionThickness: 1,
      }
    );

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0]?.accepted).toBe(true);
  });
});
