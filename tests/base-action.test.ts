import { PromisePool } from '../dist';

//------------------------------TEST HELPERS------------------------------
function pause(milliseconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + milliseconds ?? 3e3), milliseconds ?? 3e3);
    });
}

function throwErr(milliseconds?: number) {
    return new Promise<string>((_, reject) => {
        setTimeout(() => reject('Paused for ' + milliseconds ?? 3e3 + ' and threw error'), milliseconds ?? 3e3);
    });
}
async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}

//--------------------------TESTS-------------------------------

test('base-processing (mode: allSettled)', async () => {
    const promiseCount = Math.ceil(Math.random() * 6);
    const promiseSet = new Array(promiseCount).fill(0).map((_) => (Math.random() <= 0.7 ? randomDogImageFetch : pause.bind(null, 1500)));
    const qpp = new PromisePool(promiseSet, {
        concurrency: 2,
    });
    const result = await qpp.process();
    expect(result.length).toBe(promiseCount);
}, 20000);

test('base-error-handling-check (mode: all)', async () => {
    const qpp = new PromisePool([throwErr.bind(null, 1e3)], {
        mode: 'all',
    });
    expect(await qpp.process()).toThrow();
});

test('queuing-items-resolve-reject-check', async () => {
    const qpp = new PromisePool();
    //No Process on Queue
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
    expect(resolveArr).toBe({ status: 'fulfilled', value: 'queued promise' });
    expect(qpp.checkTaskMeta('isProcessing')).toEqual(false);

    //Process on Queue
    const rejectArr = await qpp.enqueue(
        [
            () =>
                new Promise((_, reject) => {
                    reject('queued promise 2');
                }),
        ],
        true
    );
    expect(rejectArr.length).toBe(1);
    expect(rejectArr[0]).toBe({ status: 'rejected', reason: 'queued promise 2' });
    expect(qpp.checkTaskMeta('isProcessing')).toBe(false);
});

test('task-processing-status-checks', async () => {
    const testSet = [randomDogImageFetch];
    let streamCount = 0;
    const qpp = new PromisePool(testSet, {
        concurrency: 2,
        stream: (_d) => {
            streamCount++;
        },
    });
    //ADD forced delay with queue
    const fProcess = qpp.enqueue([pause.bind(null, 2e3), pause.bind(null, 1e3), randomDogImageFetch], true);
});

// test('process-streaming', async () => {
//     const qpp = new PromisePool<unknown>([], {
//         concurrency: 2,
//     });
// });
