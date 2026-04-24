import { minifyPng } from './minify-png';

describe('minifyPng', () => {
  it('rewrites accepted non-edge flat regions', async () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(0);

    for (let index = 0; index < data.length; index += 4) {
      data[index] = 80;
      data[index + 1] = 82;
      data[index + 2] = 84;
      data[index + 3] = 255;
    }

    const result = await minifyPng(
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

    expect(result.channels).toBe(4);
    expect(result.stats.posterizedPixelCount).toBeGreaterThan(0);
  });

  it('carries the requested quality mode into encode hints', async () => {
    const result = await minifyPng(
      {
        channels: 4,
        data: Uint8ClampedArray.from([80, 82, 84, 255]),
        width: 1,
        height: 1,
      },
      {
        qualityMode: 'aggressive',
      }
    );

    expect(result.encodeHints?.qualityMode).toBe('aggressive');
  });
});
