<div align="center">
  <p>
    <h3>Promise Pool</h3>
  </p>
  <p>
    Queue based promise pool for node.js.
  </p>
  <p>
    <em>Leave a Like! or check out my portfolio <a href="https://arthurlee.bio">arthurlee.bio</a></em>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@arthur.lee945/promise-pool"><img src="https://img.shields.io/npm/v/@arthur.lee945/promise-pool.svg" alt="Latest Version"></a>
    <a href="https://www.npmjs.com/package/@arthur.lee945/promise-pool"><img src="https://img.shields.io/npm/dm/@arthur.lee945/promise-pool.svg" alt="Monthly downloads"></a>
  </p>
</div>

## Usage

Using this Promise pool is relatively simple.

Here’s an example using a concurrency of 2:

```js
import { PromisePool } from 'promise-pool';

const SampleTast = [() => new Promise((resolve) => resolve('Resolving Promise'))];

const result = new PromisePool(SampleTast).process();
```

The promise pool takes in this options

```js
new PromisePool(SampleTest, {
    concurrency:10;
    settle: true;
    stream?: (returns) => {
        //DoSomething
    };
})
```

## Useful Methods

-   **_enqueue_**
    ```js
    /**
     * Add a promise to the queue
     * @param { ProcessableItem<TReturn> } items (..._args: any[]) => Promise<TReturn>
     * @returns {PromisePool}
     */
    const processOnQueue = true;
    new PromisePool().enqueue(tasks, processOnQueue);
    ```
-   **_dequeue_**
    ```js
    /**
     * Take out next promise in queue or undefined
     * @returns { ProcessableItem<TReturn>[] | undefined }
     */
    new PromisePool().dequeue();
    ```
-   **_peek_**
    ```js
    /**
     * Take a peek at next promise to be processed in queue
     * @returns { ProcessableItem<TReturn> | undefined }
     */
    new PromisePool().peek();
    ```
-   **_isEmpty_**
    ```js
    /**
     * Check if there are processable items in queue
     * @returns { boolean }
     */
    new PromisePool().isEmpty();
    ```
-   **_getTaskMeta_**
    ```js
    /**
     * Take a peek at next promise to be processed in queue
     * @param { "updated" | "stopped" | "isProcessing" } opt
     * @returns { boolean }
     */
    new PromisePool().getTaskMeta('isProcessing');
    ```
-   **_setConcurrency_**
    ```js
    /**
     * @param { number } concurrency number to update
     * @returns { PromisePool<TReturn> }
     */
    new PromisePool().setConcurrency(100);
    ```
-   **_setStream_**
    ```js
    /**
     * @param { (_data: TReturn[]) => void } cb  Add or Update stream callback function
     * @returns { PromisePool<TReturn> }
     */
    new PromisePool().setStream((returns) => {
        //Do something
    });
    ```
-   **_stop_**
    ```js
    /**
     * Stops Currently running process excluding already processing task set
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    ```
-   **_process_**

    ```js
    /**
     * Starts the process
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    new PromisePool().process();
    ```
