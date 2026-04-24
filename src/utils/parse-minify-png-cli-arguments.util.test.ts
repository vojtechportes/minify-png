import { parseMinifyPngCliArguments } from './parse-minify-png-cli-arguments.util';

describe('parseMinifyPngCliArguments', () => {
  it('parses input, output, and pngquant flags', () => {
    expect(
      parseMinifyPngCliArguments([
        '--input',
        'input.png',
        '--output',
        'output.png',
        '--pngquant',
        '--pngquant-bin',
        'C:\\pngquant\\pngquant.exe',
        '--pngquant-quality',
        '80-95',
        '--pngquant-speed',
        '3',
      ])
    ).toEqual({
      help: false,
      inputPath: 'input.png',
      outputPath: 'output.png',
      pngquant: true,
      pngquantOptions: {
        binaryPath: 'C:\\pngquant\\pngquant.exe',
        quality: [80, 95],
        speed: 3,
      },
      qualityMode: 'strict',
      verbose: false,
    });
  });

  it('parses help flags', () => {
    expect(parseMinifyPngCliArguments(['--help'])).toEqual({
      help: true,
      qualityMode: 'strict',
      verbose: false,
    });
  });

  it('parses the quality mode flag', () => {
    expect(
      parseMinifyPngCliArguments(['--quality-mode', 'aggressive'])
    ).toEqual({
      help: false,
      qualityMode: 'aggressive',
      verbose: false,
    });
  });

  it('throws on an unknown argument', () => {
    expect(() => parseMinifyPngCliArguments(['--wat'])).toThrow(
      'Unknown argument: --wat'
    );
  });
});
