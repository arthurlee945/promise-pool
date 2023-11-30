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
            concurrency: 1,
            stream: (data) => {
                console.log(data, 'stream-' + i++);
                console.log('//----------------------LB');
            },
        });
        await qpp.process();
        // let i = 0;
        // const qpp = new PromisePool(promiseSet, {
        //     concurrency: 2,
        //     stream: (data) => {
        //         console.log(data, 'stream-' + i++);
        //     },
        // });
        // qpp.enqueue([pause(5e3, 'Added it from QUEUE 1, Should Trigger stream'), randomDogImageFetch()], false);
    } catch (err) {
        console.log(JSON.stringify(err));
    }
})();
