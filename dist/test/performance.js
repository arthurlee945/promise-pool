"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const batchSize = 10000;
function pause(milliseconds, comment) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(`Paused for ${milliseconds ?? 2e3}` + comment ? `comment: ${comment}` : ''), milliseconds ?? 2e3);
    });
}
function createPromises(size) {
    return new Array(size).fill(0).map(() => exec);
}
async function exec() {
    await pause(1e3);
}
async function run() {
    console.log('Creating promises');
    const promisePool = createPromises(batchSize);
    console.time('PromisePool');
    const qpp = new __1.PromisePool(promisePool, { concurrency: batchSize });
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
//# sourceMappingURL=performance.js.map