import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const benchmarkDirectoryPath = dirname(fileURLToPath(import.meta.url));
const benchmarkRootPath = dirname(benchmarkDirectoryPath);
const resultsDirectoryPath = join(benchmarkRootPath, 'results');
const originalDirectoryPath = join(resultsDirectoryPath, 'original-png');
const compressedDirectoryPath = join(resultsDirectoryPath, 'compressed-png');
const summaryFilePath = join(resultsDirectoryPath, 'results.json');

export const benchmarkPaths = {
  compressedDirectoryPath,
  originalDirectoryPath,
  resultsDirectoryPath,
  summaryFilePath,
};
