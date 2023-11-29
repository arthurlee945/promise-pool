import { PromisePool } from '../dist/src';

function pause(seconds?: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), seconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
test('base-use-case', async () => {
    const promiseSet = [randomDogImageFetch(), randomDogImageFetch(), randomDogImageFetch(), pause(), randomDogImageFetch()];
    const qpp = new PromisePool<unknown>({
        items: promiseSet,
        concurrency: 2,
    });
    const result = await qpp.process();
    console.log(result);
    expect(result.length).toBe(promiseSet.length);
}, 10000);
