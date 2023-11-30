import { PromisePool } from '.';

//ADD ERROR HANDLING
function pause(seconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + seconds ?? 2e3), seconds ?? 2e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
const promiseSet = [
    pause(),
    randomDogImageFetch(),
    pause(),
    randomDogImageFetch(),
    randomDogImageFetch(),
    randomDogImageFetch(),
    randomDogImageFetch(),
    randomDogImageFetch(),
];
//eslint-disable-next-line
(async () => {
    await pause(10);
    try {
        let i = 0;
        const qpp = new PromisePool({
            items: promiseSet,
            concurrency: 2,
            stream: (data) => {
                console.log(data, 'stream-' + i++);
            },
        });
        console.log(await qpp.process(), 'Finalized');
    } catch (err) {
        console.log(JSON.stringify(err));
    }
})();
