// export const x = 'test';

//eslint-disable-next-line
(async () => {
    const x = [];
    for (let i = 0; i < 120; i++) {
        x.push(
            new Promise<number>((resolve) => {
                setTimeout(() => {
                    resolve(i);
                }, 2000);
            })
        );
    }
    console.log(await Promise.all(x));
})();
