import { dim, green, red } from 'chalk';

import { toBeFile } from './toBeFile';

describe(toBeFile, () => {
    it('yields an error when comparing a file to itself', async () => {
        const file = new File([], 'example.tsx');

        await expect(expect(file).not.toBeFile(file)).rejects.toEqual(
            new Error(dim('The expected file is the same as the received, replace "toBeFile" with "toBe"'))
        );
        await expect(expect(file).toBeFile(file)).rejects.toEqual(
            new Error(dim('The expected file is the same as the received, replace "toBeFile" with "toBe"'))
        );
    });

    it('yields an error when trying to expect something that is not a file', async () => {
        const file = new File([], 'example.tsx', { lastModified: 0 });

        await expect(expect('').toBeFile(file)).rejects.toEqual(new Error('Received value is not an Object'));

        await expect(expect(new Error()).toBeFile(file)).rejects.toEqual(
            new Error([`Expected constructor: ${green('"Error"')}`, `Received constructor: ${red('"File"')}`].join('\n'))
        );

        await expect(new Error()).not.toBeFile(file);
    });

    it('compares all fields of a file', async () => {
        const fileOne = new File(['I am sample file'], 'example.txt', { type: 'application/text', lastModified: 1619799002227 });
        const fileTwo = new File(['I am sample file'], 'example.txt', { type: 'application/text', lastModified: 1619799002227 });

        await expect(fileOne).toBeFile(fileTwo);

        await expect(expect(fileOne).not.toBeFile(fileTwo)).rejects.toEqual(new Error(dim('Received and expected files are equals')));
    });

    it('ignores fields when comparing', async () => {
        const file = new File(['I am sample file'], 'example.txt', { type: 'application/text', lastModified: 1619799002227 });
        const anotherFile = new File(['"I am other sample file"'], 'example.json', { type: 'application/json', lastModified: 1619799002228 });

        await expect(file).toBeFile(anotherFile, { omit: ['lastModified', 'name', 'size', 'type'], content: false });

        await expect(expect(file).not.toBeFile(anotherFile, { omit: ['lastModified', 'name', 'size', 'type'], content: false })).rejects.toEqual(
            new Error(dim('Received and expected files are equals'))
        );

        await expect(expect(file).toBeFile(anotherFile, { omit: ['lastModified', 'name', 'size', 'type'] })).rejects.toEqual(
            new Error(
                [
                    'Expected File contents to be:',
                    '',
                    green('- Expected'),
                    red('+ Received'),
                    '',
                    green('- "I am other sample file"'),
                    red('+ I am sample file'),
                ].join('\n')
            )
        );

        await expect(expect(file).toBeFile(anotherFile, { omit: ['lastModified', 'name', 'size'], content: false })).rejects.toEqual(
            new Error(
                ['Expected File.type to be:', '', green('- Expected'), red('+ Received'), '', green('- application/json'), red('+ application/text')].join('\n')
            )
        );

        await expect(expect(file).toBeFile(anotherFile, { omit: ['lastModified', 'name', 'type'], content: false })).rejects.toEqual(
            new Error(['Expected File.size to be:', '', green('- Expected'), red('+ Received'), '', green('- 24'), red('+ 16')].join('\n'))
        );

        await expect(expect(file).toBeFile(anotherFile, { omit: ['lastModified', 'size', 'type'], content: false })).rejects.toEqual(
            new Error(['Expected File.name to be:', '', green('- Expected'), red('+ Received'), '', green('- example.json'), red('+ example.txt')].join('\n'))
        );

        await expect(expect(file).toBeFile(anotherFile, { omit: ['name', 'size', 'type'], content: false })).rejects.toEqual(
            new Error(
                ['Expected File.lastModified to be:', '', green('- Expected'), red('+ Received'), '', green('- 1619799002228'), red('+ 1619799002227')].join(
                    '\n'
                )
            )
        );
    });

    it('throws errors when reading throws exception', async () => {
        const file = new File(['I am sample file'], 'example.txt', { type: 'application/text', lastModified: 1619799002227 });
        const anotherFile = new File(['I am sample file'], 'example.txt', { type: 'application/text', lastModified: 1619799002227 });

        const readAsDataURLSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
        const getLastFileReaderInstance = (): FileReader => {
            const instances = readAsDataURLSpy.mock.instances as unknown[] as FileReader[];
            return instances[instances.length - 1];
        };

        const fakeEvent = new ProgressEvent('fake event') as ProgressEvent<FileReader>;

        readAsDataURLSpy
            .mockImplementationOnce(() => getLastFileReaderInstance().onloadend?.(fakeEvent))
            .mockImplementationOnce(() => getLastFileReaderInstance().onloadend?.(fakeEvent))
            .mockImplementationOnce(() => getLastFileReaderInstance().onabort?.(fakeEvent))
            .mockImplementationOnce(() => getLastFileReaderInstance().onabort?.(fakeEvent))
            .mockImplementationOnce(() => getLastFileReaderInstance().onerror?.(fakeEvent))
            .mockImplementationOnce(() => getLastFileReaderInstance().onerror?.(fakeEvent));

        await expect(expect(file).toBeFile(anotherFile, { content: 'readAsDataURL' })).rejects.toEqual(
            new Error('Could not read file content. Reason: File did not load')
        );

        await expect(expect(file).toBeFile(anotherFile, { content: 'readAsDataURL' })).rejects.toEqual(
            new Error('Could not read file content. Reason: File did not load because of it was aborted')
        );

        await expect(expect(file).toBeFile(anotherFile, { content: 'readAsDataURL' })).rejects.toEqual(
            new Error('Could not read file content. Reason: File did not load because of an error')
        );
    });
});
