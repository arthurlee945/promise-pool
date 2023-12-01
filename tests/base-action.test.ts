import { PromisePool } from '../dist';

function pause(milliseconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + milliseconds ?? 3e3), milliseconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}

test('base-processing', async () => {
    const promiseCount = Math.ceil(Math.random() * 10);
    const promiseSet = new Array(promiseCount).fill(0).map((_) => (Math.random() <= 0.7 ? randomDogImageFetch : pause.bind(null, 1500)));
    const qpp = new PromisePool<unknown>(promiseSet, {
        concurrency: 2,
    });
    const result = await qpp.process();
    expect(result.length).toBe(promiseCount);
}, 20000);

test('queuing-items-result-check', async () => {
    const qpp = new PromisePool();

    const resolveArr = (
        await qpp
            .enqueue(
                [
                    () =>
                        new Promise((resolve) => {
                            resolve('queued promise');
                        }),
                ],
                false
            )
            .process()
    )[0];
    expect(resolveArr.status).toBe('fulfilled');
    if (resolveArr.status === 'fulfilled') expect(resolveArr.value).toBe('queued promise');
    expect(qpp.checkTaskMeta('isProcessing')).toBe(false);

    const rejectArr = await qpp
        .enqueue(
            [
                () =>
                    new Promise((_, reject) => {
                        reject('queued promise 2');
                    }),
            ],
            false
        )
        .process();
    expect(rejectArr.length).toBe(1);
    expect(rejectArr[0].status).toBe('rejected');
    if (rejectArr[0].status === 'rejected') expect(rejectArr[0].reason).toBe('queued promise 2');
    expect(qpp.checkTaskMeta('isProcessing')).toBe(false);
});

// test('task-processing-status-checkes', async () => {
//     const testSet = [randomDogImageFetch, ]
//     const qpp = new PromisePool<unknown>([], {
//         concurrency: 2,
//     });
// });

// test('process-streaming', async () => {
//     const qpp = new PromisePool<unknown>([], {
//         concurrency: 2,
//     });
// });
