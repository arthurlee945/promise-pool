import { PromisePool } from '../dist';

//------------------------------TEST HELPERS------------------------------
function pause(milliseconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + milliseconds ?? 3e3), milliseconds ?? 3e3);
    });
}

function throwErr(milliseconds?: number) {
    return new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Paused for ' + milliseconds ?? 3e3 + ' and threw error')), milliseconds ?? 3e3);
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
        settle: false,
    });
    expect(qpp.process).toThrow();
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

    expect(resolveArr).toStrictEqual({ status: 'fulfilled', value: 'queued promise' });
    expect(qpp.getTaskMeta('isProcessing')).toEqual(false);

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
    expect(rejectArr[0]).toStrictEqual({ status: 'rejected', reason: 'queued promise 2' });
    expect(qpp.getTaskMeta('isProcessing')).toBe(false);
});

test('task-processing-status-checks', async () => {
    const testSet = [randomDogImageFetch];
    const qpp = new PromisePool(testSet, {
        concurrency: 2,
    });
    //ADD forced delay with queue
    qpp.enqueue([pause.bind(null, 2e3), randomDogImageFetch, pause.bind(null, 1e3)], true);
    setTimeout(async () => {
        expect(qpp.getTaskMeta('isProcessing')).toEqual(true);
        expect(qpp.getTaskMeta('updated')).toEqual(false);
        expect(qpp.getTaskMeta('stopped')).toEqual(false);
        qpp.enqueue([
            () =>
                new Promise((resolve) => {
                    resolve('queued promise');
                }),
        ]);
        expect(qpp.getTaskMeta('updated')).toBeTruthy();
        const result = await qpp.process();
        expect(result.length).toEqual(5);
        expect(result[result.length - 1]).toStrictEqual({
            status: 'fulfilled',
            value: 'queued promise',
        });
    }, 1000);
});

test('process-stopping', async () => {
    const qpp = new PromisePool<unknown>(
        [pause.bind(null, 1e3), pause.bind(null, 1e3), pause.bind(null, 1e3), pause.bind(null, 2e3), pause.bind(null, 2e3)],
        {
            concurrency: 1,
        }
    );
    qpp.process();
    setTimeout(async () => {
        const stoppedProcess = await qpp.stop();
        if (!stoppedProcess) return;
        expect(stoppedProcess.length).toEqual(3);
        expect(qpp.getTaskMeta('isProcessing')).toEqual(false);
    }, 2500);
}, 10000);

test('process-stream-cb', async () => {
    let i = 1;
    const qpp = new PromisePool<unknown>(
        [pause.bind(null, 1e3), pause.bind(null, 1e3), pause.bind(null, 1e3), pause.bind(null, 2e3), pause.bind(null, 2e3)],
        {
            concurrency: 1,
            stream: (result) => {
                expect(result.length).toEqual(i++);
            },
        }
    );
    await qpp.process();
}, 10000);
