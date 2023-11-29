import { PromisePool } from '.';

//eslint-disable-next-line
(async () => {
    try {
        const qpp = new PromisePool({
            items: [fetch('https://dog.ceo/api/breeds/image/random').then((res) => res.json())],
        });
        console.log(await qpp.process());
        console.log(qpp.tasks, qpp.results, qpp.isEmpty(), qpp.isProcessing());
    } catch (err) {
        console.log(JSON.stringify(err));
    }
})();
