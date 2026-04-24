import { EventEmitter } from 'node:events';

const spawnMock = jest.fn();

jest.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

import { encodeWithPngquant } from './encode-with-pngquant.util';

type MockChildProcess = EventEmitter & {
  stdin: { end: jest.Mock<void, [Buffer]> };
  stdout: EventEmitter;
};

const createMockChildProcess = (): MockChildProcess => {
  const child = new EventEmitter() as MockChildProcess;

  child.stdin = {
    end: jest.fn(),
  };
  child.stdout = new EventEmitter();

  return child;
};

describe('encodeWithPngquant', () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it('returns stdout output when pngquant succeeds', async () => {
    const child = createMockChildProcess();

    spawnMock.mockReturnValue(child);

    const promise = encodeWithPngquant(Buffer.from('source'), {
      colors: 256,
      quality: [80, 95],
      speed: 4,
    });

    child.stdout.emit('data', Buffer.from('optimized'));
    child.emit('close', 0);

    await expect(promise).resolves.toEqual({
      buffer: Buffer.from('optimized'),
      success: true,
    });
    expect(spawnMock).toHaveBeenCalledWith(
      'pngquant',
      ['256', '--quality=80-95', '--speed', '4', '-'],
      { stdio: ['pipe', 'pipe', 'ignore'] }
    );
    expect(child.stdin.end).toHaveBeenCalledWith(Buffer.from('source'));
  });

  it('returns a detailed failure when pngquant is unavailable', async () => {
    const child = createMockChildProcess();

    spawnMock.mockReturnValue(child);

    const promise = encodeWithPngquant(Buffer.from('source'));

    child.emit('error', new Error('spawn ENOENT'));

    await expect(promise).resolves.toEqual({
      message: 'spawn error: spawn ENOENT',
      success: false,
    });
  });

  it('returns a detailed failure when pngquant exits non-zero', async () => {
    const child = createMockChildProcess();

    spawnMock.mockReturnValue(child);

    const promise = encodeWithPngquant(Buffer.from('source'));

    child.emit('close', 99, null);

    await expect(promise).resolves.toEqual({
      message:
        'exited with code 99 (pngquant could not meet the requested quality range)',
      success: false,
    });
  });
});
