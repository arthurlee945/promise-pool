function pause(seconds?: number) {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve('Paused for ' + seconds ?? 3e3), seconds ?? 3e3);
    });
}

async function randomDogImageFetch() {
    return (await fetch('https://dog.ceo/api/breeds/image/random')).json();
}
test('base-use-case', async () => {
    const promiseSet = [randomDogImageFetch(), randomDogImageFetch(), randomDogImageFetch(), pause(), randomDogImageFetch()];
    // console.log(promiseSet);
    // const qpp = new PromisePool<unknown>({
    //     items: promiseSet,
    //     concurrency: 2,
    // });
    // const result = await qpp.process();
    // console.log(result);
    // expect(result.length).toBe(promiseSet.length);
}, 10000);
