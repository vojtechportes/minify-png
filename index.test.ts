import * as api from './src/index';

describe('index exports', () => {
  it('exports the public runtime API', () => {
    expect(api.analyzeFlatRegions).toBeDefined();
    expect(api.minifyPng).toBeDefined();
    expect(api.encodeOptimizedPng).toBeDefined();
    expect(api.defaultMinifyPngOptions).toBeDefined();
  });
});
