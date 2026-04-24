import { calculateColorDistance } from './calculate-color-distance.util';

describe('calculateColorDistance', () => {
  it('returns zero for identical colors', () => {
    expect(calculateColorDistance([10, 20, 30, 255], [10, 20, 30, 255])).toBe(
      0
    );
  });

  it('accounts for premultiplied alpha when requested', () => {
    const straight = calculateColorDistance(
      [255, 0, 0, 128],
      [0, 0, 0, 0],
      false
    );
    const premultiplied = calculateColorDistance(
      [255, 0, 0, 128],
      [0, 0, 0, 0],
      true
    );

    expect(premultiplied).toBeLessThan(straight);
  });
});
