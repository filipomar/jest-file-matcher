# jest-file-matcher

A simple, Typescript ready, jest matcher extension to validate [files](https://developer.mozilla.org/en-US/docs/Web/API/File).

### Setup:

###### jest.config.ts / jest.config.js

```ts
export default {
    /** Just add this project on your jest setup */
    setupFilesAfterEnv: ['jest-file-matcher'],
};
```

### Usage:

###### Example.test.ts

```ts
describe('Example of test', () => {
    it('Test #1', async () => {
        await expect(new File([], 'example.tsx', { lastModified: 1 }))
            /** You can ignore some fields of the File as needed */
            .toBeFile(new File([], 'example.tsx', { lastModified: 0 }), { omit: ['lastModified'] });

        await expect(new File(['I am the content'], 'example.txt', { lastModified: 0 }))
            /** You can read the content of the file as you want */
            .toBeFile(new File(['I am the content'], 'example.txt', { lastModified: 0 }), { content: 'readAsDataURL' });

        await expect(new File(['I am the content'], 'example.txt', { lastModified: 0 }))
            /** Or ignore it all together*/
            .toBeFile(new File(['I am the content'], 'example.txt', { lastModified: 0 }), { content: false });

        await expect(new File(['I am the content'], 'example.txt', { lastModified: 0 }))
            /** And make sure that they don't match too*/
            .not.toBeFile(new File(["I'm not it however"], 'example.txt', { lastModified: 0 }));

        /**
         * See other cases on the typescript definition file!
         **/

        /**
         * Lastly, the code below will always fail with the warning:
         * The expected file is the same as the received, replace "toBeFile" with "toBe"
         */
        const file = new File(['I am the content'], 'example.txt', { lastModified: 0 });
        await expect(file).toBeFile(file);
    });
});
```

### LICENSE

MIT
