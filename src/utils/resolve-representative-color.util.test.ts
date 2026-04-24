import { resolveRepresentativeColor } from './resolve-representative-color.util';

describe('resolveRepresentativeColor', () => {
  it('returns the per-channel median', () => {
    expect(
      resolveRepresentativeColor([
        [10, 20, 30, 255],
        [11, 21, 31, 255],
        [200, 220, 240, 255],
      ])
    ).toEqual([11, 21, 31, 255]);
  });
});
