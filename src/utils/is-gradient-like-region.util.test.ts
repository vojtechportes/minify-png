import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import { isGradientLikeRegion } from './is-gradient-like-region.util';

describe('isGradientLikeRegion', () => {
  it('detects coherent directional drift across tiles', () => {
    expect(
      isGradientLikeRegion(
        [
          {
            id: 1,
            x: 0,
            y: 0,
            width: 8,
            height: 8,
            tileX: 0,
            tileY: 0,
            representative: [10, 10, 10, 255],
            pixelIndexes: [0],
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
            representative: [60, 60, 60, 255],
            pixelIndexes: [1],
            p95Distance: 1,
            maxDistance: 1,
            alphaRange: 0,
          },
          {
            id: 3,
            x: 16,
            y: 0,
            width: 8,
            height: 8,
            tileX: 2,
            tileY: 0,
            representative: [120, 120, 120, 255],
            pixelIndexes: [2],
            p95Distance: 1,
            maxDistance: 1,
            alphaRange: 0,
          },
        ],
        defaultMinifyPngOptions
      )
    ).toBe(true);
  });
});
