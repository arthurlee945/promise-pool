import { PromisePool } from '.';

function pause(seconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + seconds ?? 3e3), seconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
const promiseSet = [randomDogImageFetch(), randomDogImageFetch(), randomDogImageFetch(), pause(), randomDogImageFetch()];
//eslint-disable-next-line
(async () => {
    try {
        let i = 0;
        const qpp = new PromisePool({
            items: promiseSet,
            concurrency: 2,
            stream: (data) => {
                console.log(data, 'stream-' + i++);
            },
        });
        console.log(await qpp.process());
    } catch (err) {
        console.log(JSON.stringify(err));
    }
})();
