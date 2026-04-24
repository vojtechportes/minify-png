import { join } from 'node:path';
import { benchmarkPaths } from './benchmark-paths.util';

export const buildCategoryOutputPaths = (categoryKey: string) => ({
  compressed: join(benchmarkPaths.compressedDirectoryPath, categoryKey),
  original: join(benchmarkPaths.originalDirectoryPath, categoryKey),
});
