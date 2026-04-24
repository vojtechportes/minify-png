import { analyzeFlatRegions } from './analyze-flat-regions.util';

describe('analyzeFlatRegions', () => {
  it('returns edge, tile, and region masks for raw RGBA input', async () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(0);

    for (let index = 0; index < data.length; index += 4) {
      data[index] = 80;
      data[index + 1] = 80;
      data[index + 2] = 80;
      data[index + 3] = 255;
    }

    const result = await analyzeFlatRegions(
      {
        channels: 4,
        data,
        width: 4,
        height: 4,
      },
      {
        tileSize: 4,
        seedMinArea: 4,
        minRegionArea: 4,
        minRegionThickness: 1,
        minUsableInteriorRatio: 0.5,
        protectedEdgeDistance: 0,
      }
    );

    expect(result.tileMask.length).toBe(1);
    expect(result.regions[0]?.accepted).toBe(true);
  });
});
