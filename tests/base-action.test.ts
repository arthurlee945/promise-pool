// import { PromisePool } from '../dist/src';

function pause(seconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + seconds ?? 3e3), seconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
test('base-use-case', async () => {
    // const promiseCount = Math.ceil(Math.random() * 10);
    // // const promiseSet = new Array(promiseCount) [randomDogImageFetch(), randomDogImageFetch(), randomDogImageFetch(), pause(), randomDogImageFetch()];
    // const qpp = new PromisePool<unknown>({
    //     items: promiseSet,
    //     concurrency: 2,
    // });
    // const result = await qpp.process();
    // expect(result.length).toBe(promiseCount);
}, 10000);
