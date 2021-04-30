import { ToBeFileOptions, toBeFile } from './toBeFile';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toBeFile(expected: File, args?: ToBeFileOptions): Promise<R>;
        }
    }
}

expect.extend({ toBeFile });

export {};
