import { rm, writeFile } from 'node:fs/promises';
import { defaultWikimediaCategories } from './constants/default-wikimedia-categories';
import { benchmarkPaths } from './utils/benchmark-paths.util';
import type {
  BenchmarkImageRecord,
  BenchmarkResults,
} from './types/benchmark-types';
import { collectBenchmarkCandidates } from './utils/collect-benchmark-candidates.util';
import { ensureBenchmarkDirectories } from './utils/ensure-benchmark-directories.util';
import { parseRequestedImageCount } from './utils/parse-requested-image-count.util';
import { summarizeBenchmarkResults } from './utils/summarize-benchmark-results.util';
import { writeBenchmarkImage } from './utils/write-benchmark-image.util';

const run = async (): Promise<void> => {
  const requestedImageCount = parseRequestedImageCount();
  const imagesPerCategory = Math.ceil(
    requestedImageCount / defaultWikimediaCategories.length
  );

  await rm(benchmarkPaths.resultsDirectoryPath, {
    force: true,
    recursive: true,
  });
  await ensureBenchmarkDirectories();

  const benchmarkCandidates = await collectBenchmarkCandidates(
    defaultWikimediaCategories,
    imagesPerCategory
  );
  const imageRecords: BenchmarkImageRecord[] = [];

  for (const candidate of benchmarkCandidates.slice(0, requestedImageCount)) {
    try {
      const imageRecord = await writeBenchmarkImage(
        candidate.category,
        candidate.fileTitle
      );

      if (imageRecord) {
        imageRecords.push(imageRecord);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Skipping ${candidate.fileTitle}: ${message}`);
    }
  }

  const results: BenchmarkResults = {
    generatedAt: new Date().toISOString(),
    images: imageRecords,
    summary: summarizeBenchmarkResults(imageRecords),
  };

  await writeFile(
    benchmarkPaths.summaryFilePath,
    JSON.stringify(results, null, 2)
  );
  console.log(
    JSON.stringify(
      {
        count: results.summary.count,
        summaryFilePath: benchmarkPaths.summaryFilePath,
        totalCompressedPngBytes: results.summary.totalCompressedPngBytes,
        totalOriginalPngBytes: results.summary.totalOriginalPngBytes,
      },
      null,
      2
    )
  );
};

await run();
