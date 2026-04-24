const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const minifyPngMock = jest.fn();
const encodeOptimizedPngMock = jest.fn();
const stdoutWriteMock = jest.fn();
const stderrWriteMock = jest.fn();

jest.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
}));

jest.mock('../minify-png', () => ({
  minifyPng: (...args: unknown[]) => minifyPngMock(...args),
}));

jest.mock('./encode-optimized-png.util', () => ({
  encodeOptimizedPng: (...args: unknown[]) => encodeOptimizedPngMock(...args),
}));

import { runMinifyPngCli } from './run-minify-png-cli.util';

describe('runMinifyPngCli', () => {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  beforeAll(() => {
    Object.defineProperty(process.stdout, 'write', {
      value: stdoutWriteMock,
    });
    Object.defineProperty(process.stderr, 'write', {
      value: stderrWriteMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(process.stdout, 'write', {
      value: originalStdoutWrite,
    });
    Object.defineProperty(process.stderr, 'write', {
      value: originalStderrWrite,
    });
  });

  beforeEach(() => {
    readFileMock.mockReset();
    writeFileMock.mockReset();
    minifyPngMock.mockReset();
    encodeOptimizedPngMock.mockReset();
    stdoutWriteMock.mockReset();
    stderrWriteMock.mockReset();
  });

  it('processes an input PNG and writes the output PNG', async () => {
    readFileMock.mockResolvedValue(Buffer.from('source'));
    minifyPngMock.mockResolvedValue({
      data: Uint8ClampedArray.from([1, 2, 3, 4]),
    });
    encodeOptimizedPngMock.mockResolvedValue(Buffer.from('output'));

    await expect(
      runMinifyPngCli(['--input', 'in.png', '--output', 'out.png'])
    ).resolves.toBe(0);

    expect(readFileMock).toHaveBeenCalledWith('in.png');
    expect(writeFileMock).toHaveBeenCalledWith(
      'out.png',
      Buffer.from('output')
    );
    expect(stdoutWriteMock).toHaveBeenCalledWith('Wrote out.png\n');
  });

  it('writes help text when requested', async () => {
    await expect(runMinifyPngCli(['--help'])).resolves.toBe(0);

    expect(stdoutWriteMock).toHaveBeenCalled();
    expect(readFileMock).not.toHaveBeenCalled();
  });

  it('returns an error when required paths are missing', async () => {
    await expect(runMinifyPngCli(['--input', 'in.png'])).resolves.toBe(1);

    expect(stderrWriteMock).toHaveBeenCalledWith(
      'Both --input and --output are required. Run with --help for usage.\n'
    );
  });
});
