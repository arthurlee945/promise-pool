const { PromisePool } = require('@supercharge/promise-pool');

test('placeholder', async () => {
    const box = [];
    for (let i = 0; i < 50; i++) {
        box.push(fetch('https://dog.ceo/api/breeds/image/random'));
    }
    const { results, errors } = await PromisePool.for(box).process(async (data, i, pool) => {
        return await data;
    });
    console.log(results);

    expect(1).toEqual(1);
});
