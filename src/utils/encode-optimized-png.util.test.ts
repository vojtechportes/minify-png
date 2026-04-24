jest.mock('sharp', () => ({
  __esModule: true,
  default: () => {
    throw new Error('sharp unavailable in test');
  },
}));

const mockSync: { write: jest.Mock<Buffer, []> } = {
  write: jest.fn(() => Buffer.from('png')),
};

jest.mock('pngjs', () => ({
  PNG: class PNG {
    static sync = mockSync;
    data = Buffer.alloc(0);
    width: number;
    height: number;

    constructor(options: { width: number; height: number }) {
      this.width = options.width;
      this.height = options.height;
    }
  },
}));

import { encodeOptimizedPng } from './encode-optimized-png.util';

describe('encodeOptimizedPng', () => {
  it('encodes normalized RGBA output using pngjs', async () => {
    const result = await encodeOptimizedPng({
      channels: 4,
      data: Uint8ClampedArray.from([1, 2, 3, 255]),
      width: 1,
      height: 1,
    });

    expect(result.equals(Buffer.from('png'))).toBe(true);
  });
});
