import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EncodeQualityMode } from '../src/types/minify-png-types';
import { encodeOptimizedPng, minifyPng } from '../src/index';

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));
const sourceFilePath = join(currentDirectoryPath, 'test.png');
const outputFilePath = join(currentDirectoryPath, 'test.min.png');

type TestRunnerOptions = {
  pngquant: boolean;
  pngquantBinaryPath?: string;
  pngquantQuality?: readonly [number, number];
  pngquantSpeed?: number;
  qualityMode: EncodeQualityMode;
  verbose: boolean;
};

const requireNextValue = (
  argumentsList: string[],
  index: number,
  flag: string
): string => {
  const value = argumentsList[index + 1];

  if (value === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
};

const parsePngquantQuality = (value: string): readonly [number, number] => {
  const [minimum, maximum] = value.split('-').map((part) => Number(part));

  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    minimum < 0 ||
    maximum > 100 ||
    minimum > maximum
  ) {
    throw new Error(
      'Invalid value for --pngquant-quality. Use the format min-max, for example 80-95.'
    );
  }

  return [minimum, maximum];
};

const parseQualityMode = (value: string): EncodeQualityMode => {
  if (value === 'strict' || value === 'balanced' || value === 'aggressive') {
    return value;
  }

  throw new Error(
    'Invalid value for --quality-mode. Use strict, balanced, or aggressive.'
  );
};

const parseTestRunnerOptions = (argumentsList: string[]): TestRunnerOptions => {
  const parsedOptions: TestRunnerOptions = {
    pngquant:
      process.env.USE_PNGQUANT === '1' ||
      process.env.USE_PNGQUANT?.toLowerCase() === 'true',
    pngquantBinaryPath: process.env.PNGQUANT_BIN,
    qualityMode: 'strict',
    verbose: false,
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    switch (argument) {
      case '--pngquant':
        parsedOptions.pngquant = true;
        break;
      case '--verbose':
        parsedOptions.verbose = true;
        break;
      case '--quality-mode':
        parsedOptions.qualityMode = parseQualityMode(
          requireNextValue(argumentsList, index, argument)
        );
        index += 1;
        break;
      case '--pngquant-bin':
        parsedOptions.pngquant = true;
        parsedOptions.pngquantBinaryPath = requireNextValue(
          argumentsList,
          index,
          argument
        );
        index += 1;
        break;
      case '--pngquant-quality':
        parsedOptions.pngquant = true;
        parsedOptions.pngquantQuality = parsePngquantQuality(
          requireNextValue(argumentsList, index, argument)
        );
        index += 1;
        break;
      case '--pngquant-speed': {
        parsedOptions.pngquant = true;
        const speed = Number(requireNextValue(argumentsList, index, argument));

        if (!Number.isInteger(speed) || speed < 1 || speed > 10) {
          throw new Error(
            'Invalid value for --pngquant-speed. Use an integer from 1 to 10.'
          );
        }

        parsedOptions.pngquantSpeed = speed;
        index += 1;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return parsedOptions;
};

const run = async (): Promise<void> => {
  const options = parseTestRunnerOptions(process.argv.slice(2));
  const sourceBuffer = await readFile(sourceFilePath);
  const minifiedImage = await minifyPng(sourceBuffer);
  const outputBuffer = await encodeOptimizedPng(minifiedImage, {
    debugLogger: options.verbose
      ? (message) => console.log(message)
      : undefined,
    pngquant: options.pngquant
      ? {
          binaryPath: options.pngquantBinaryPath,
          quality: options.pngquantQuality ?? [85, 95],
          speed: options.pngquantSpeed ?? 3,
        }
      : false,
    qualityMode: options.qualityMode,
  });

  await writeFile(outputFilePath, outputBuffer);
};

await run();
