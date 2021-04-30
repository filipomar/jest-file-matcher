type ReadStrategies = {
    readonly readAsArrayBuffer: ArrayBuffer;
    readonly readAsBinaryString: string;
    readonly readAsDataURL: string;
    readonly readAsText: string;
};

type ComparableFileProps = Extract<keyof File, 'lastModified' | 'name' | 'size' | 'type'>;

type RequiredToBeFileOptions = {
    /**
     * @description use this to **not** compare fields
     * @default []
     */
    readonly omit: ComparableFileProps[];

    /**
     * @description How to read the content of the file, false to ignore
     * @default 'readAsText'
     */
    readonly content: keyof ReadStrategies | false;
};

export type ToBeFileOptions = Partial<RequiredToBeFileOptions>;

const readFile = <S extends keyof ReadStrategies>(file: File, strategy: S): Promise<ReadStrategies[S]> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (reader.result === null) {
                reject(new Error('File did not load'));
            } else {
                resolve(reader.result as ReadStrategies[S]);
            }
        };

        reader.onerror = () => reject(new Error('File did not load because of an error'));
        reader.onabort = () => reject(new Error('File did not load because of it was aborted'));

        reader[strategy](file);
    });

const print = (context: jest.MatcherContext, name: string, expected: unknown, received: unknown): string => {
    expected = typeof expected === 'number' ? String(expected) : expected;
    received = typeof received === 'number' ? String(received) : received;
    return `Expected ${File.name}${name} to be:\n\n${String(context.utils.diff(expected, received))}`;
};

const printProperty = (
    context: jest.MatcherContext,
    omit: Set<ComparableFileProps>,
    prop: ComparableFileProps,
    [expected, received]: [File, File]
): jest.CustomMatcherResult | null =>
    !omit.has(prop) && !context.equals(expected[prop], received[prop])
        ? { pass: false, message: () => print(context, `.${prop}`, expected[prop], received[prop]) }
        : null;

export const toBeFile: jest.CustomMatcher = async function (received: unknown, expected: File, args?: ToBeFileOptions) {
    if (received === expected) {
        /**
         * Always fails
         * This should not be used as 'toBe'
         */
        return {
            pass: this.isNot,
            message: () => this.utils.DIM_COLOR(`The expected file is the same as the received, replace "${toBeFile.name}" with "toBe"`),
        };
    }

    /**
     * Validate the given values are of the correct types
     */
    if (!(received instanceof Object) && !(received instanceof File)) {
        return { pass: false, message: () => 'Received value is not an Object' };
    }

    if (!(received instanceof File)) {
        return {
            pass: false,
            message: () => this.utils.printDiffOrStringify(received.constructor.name, File.name, 'Expected constructor', 'Received constructor', true),
        };
    }

    const omit = new Set<ComparableFileProps>(args?.omit || []);
    const propResult =
        printProperty(this, omit, 'name', [expected, received]) ||
        printProperty(this, omit, 'type', [expected, received]) ||
        printProperty(this, omit, 'size', [expected, received]) ||
        printProperty(this, omit, 'lastModified', [expected, received]);

    if (propResult) {
        return propResult;
    }

    const strategy = args?.content === false ? false : args?.content || 'readAsText';
    if (strategy) {
        try {
            const [receivedContent, expectedContent] = await Promise.all([readFile(received, strategy), readFile(expected, strategy)]);

            if (!this.equals(receivedContent, expectedContent)) {
                return { pass: false, message: () => print(this, ' contents', expectedContent, receivedContent) };
            }
        } catch (e: unknown) {
            /**
             * Fail
             */
            return { pass: this.isNot, message: () => `Could not read file content. Reason: ${(e as Error).message}` };
        }
    }

    return { pass: true, message: () => this.utils.DIM_COLOR('Received and expected files are equals') };
};
