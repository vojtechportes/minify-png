import { mkdir } from 'node:fs/promises';
import { benchmarkPaths } from './benchmark-paths.util';

export const ensureBenchmarkDirectories = async (): Promise<void> => {
  await mkdir(benchmarkPaths.originalDirectoryPath, { recursive: true });
  await mkdir(benchmarkPaths.compressedDirectoryPath, { recursive: true });
};
