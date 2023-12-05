import { PromisePool } from '..';

const batchSize = 10_000;

function pause(milliseconds?: number, comment?: string) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`Paused for ${milliseconds ?? 2e3}` + comment ? `comment: ${comment}` : ''), milliseconds ?? 2e3);
    });
}

function createPromises(size: number) {
    return new Array(size).fill(0).map(() => exec);
}

async function exec() {
    await pause(1e3);
}

async function run() {
    console.log('Creating promises');
    const promisePool = createPromises(batchSize);
    console.time('PromisePool');
    const qpp = new PromisePool(promisePool, { concurrency: batchSize });
    await qpp.process();
    console.timeEnd('PromisePool');

    const promisesAll = createPromises(batchSize).map((f) => f());
    console.time('Promise.all');
    await Promise.all(promisesAll);
    console.timeEnd('Promise.all');
}

run()
    .then(() => console.log('done'))
    .catch((error) => console.error('Failed to process promise pool performance', error));
