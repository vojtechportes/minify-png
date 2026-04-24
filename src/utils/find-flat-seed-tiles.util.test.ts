import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import { findFlatSeedTiles } from './find-flat-seed-tiles.util';

describe('findFlatSeedTiles', () => {
  it('accepts a uniform non-edge tile as a flat seed', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(0);

    for (let index = 0; index < data.length; index += 4) {
      data[index] = 100;
      data[index + 1] = 110;
      data[index + 2] = 120;
      data[index + 3] = 255;
    }

    const result = findFlatSeedTiles(data, 4, 4, new Uint8Array(16), {
      ...defaultMinifyPngOptions,
      tileSize: 4,
      seedMinArea: 4,
      minUsableInteriorRatio: 0.5,
      protectedEdgeDistance: 0,
    });

    expect(result.seeds).toHaveLength(1);
    expect(Array.from(result.tileMask)).toEqual([1]);
  });
});
