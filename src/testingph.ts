import { PromisePool } from '.';

//ADD ERROR HANDLING
function pause(milliseconds?: number, comment?: string) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`Paused for ${milliseconds ?? 2e3}` + comment ? `comment: ${comment}` : ''), milliseconds ?? 2e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
//eslint-disable-next-line
(async () => {
    const promiseSet = [
        randomDogImageFetch,
        randomDogImageFetch,
        randomDogImageFetch,
        randomDogImageFetch,
        pause.bind(null, 5e3),
        randomDogImageFetch,
        randomDogImageFetch,
    ];
    try {
        let i = 0;
        const qpp = new PromisePool(promiseSet, {
            concurrency: 2,
            settle: true,
            stream: (data) => {
                console.log(data, 'stream-' + i++);
            },
        });

        console.log(qpp.checkTaskMeta('isProcessing'));

        console.log('/-------------------------------Start Processing');
    } catch (err) {
        console.log(JSON.stringify(err));
    }
})();
