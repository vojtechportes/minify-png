declare module 'pngjs' {
  export class PNG {
    static sync: {
      read(buffer: Buffer): { data: Buffer; width: number; height: number };
      write(png: PNG, options?: Record<string, unknown>): Buffer;
    };

    data: Buffer;
    width: number;
    height: number;

    constructor(options: { width: number; height: number; colorType?: number });
  }
}
