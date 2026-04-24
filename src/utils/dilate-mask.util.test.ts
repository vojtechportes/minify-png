import { dilateMask } from './dilate-mask.util';

describe('dilateMask', () => {
  it('expands mask pixels within the given radius', () => {
    const mask = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);

    expect(Array.from(dilateMask(mask, 3, 3, 1))).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
  });
});
