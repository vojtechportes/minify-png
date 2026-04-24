import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import { detectEdgeMask } from './detect-edge-mask.util';

describe('detectEdgeMask', () => {
  it('marks sharp color transitions as protected edges', () => {
    const data = Uint8ClampedArray.from([0, 0, 0, 255, 255, 255, 255, 255]);

    const mask = detectEdgeMask(data, 2, 1, {
      ...defaultMinifyPngOptions,
      edgeDilateRadius: 0,
    });

    expect(Array.from(mask)).toEqual([1, 1]);
  });
});
