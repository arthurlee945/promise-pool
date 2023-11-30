import { PromisePool } from '../dist/src';

function pause(milliseconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + milliseconds ?? 3e3), milliseconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
test('base-use-case', async () => {
    const promiseCount = Math.ceil(Math.random() * 10);
    const promiseSet = new Array(promiseCount).fill(0).map((_) => (Math.random() <= 0.7 ? randomDogImageFetch() : pause(1500)));
    const qpp = new PromisePool<unknown>({
        items: promiseSet,
        concurrency: 2,
    });
    const result = await qpp.process();
    expect(result.length).toBe(promiseCount);
}, 20000);
