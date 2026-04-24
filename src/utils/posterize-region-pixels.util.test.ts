import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import { posterizeRegionPixels } from './posterize-region-pixels.util';

describe('posterizeRegionPixels', () => {
  it('fills accepted region interiors while preserving alpha', () => {
    const result = posterizeRegionPixels(
      Uint8ClampedArray.from([1, 2, 3, 200, 4, 5, 6, 210]),
      Uint32Array.from([1, 0]),
      Uint8Array.from([0, 1]),
      [
        {
          id: 1,
          area: 1,
          bbox: { x: 0, y: 0, width: 1, height: 1 },
          median: [9, 9, 9, 255],
          p95Distance: 0,
          maxDistance: 0,
          alphaRange: 0,
          gradientRejected: false,
          accepted: true,
        },
      ],
      defaultMinifyPngOptions
    );

    expect(Array.from(result.data)).toEqual([9, 9, 9, 200, 4, 5, 6, 210]);
    expect(result.posterizedPixelCount).toBe(1);
  });
});
