<div align="center">
  <p>
    <h3>Promise Pool</h3>
  </p>
  <p>
    Queue based promise pool for node.js.
  </p>
  <br/>
  <p>
    <em>Leave a Like! or check out my portfolio <a href="https://arthurlee.bio">arthurlee.bio</a></em>
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

-   enqueue
    ```js
    /**
     * Add a promise to the queue
     * @param { ProcessableItem<TReturn> } items (..._args: any[]) => Promise<TReturn>
     * @returns {PromisePool}
     */
    const processOnQueue = true;
    new PromisePool().enqueue(tasks, processOnQueue);
    ```
-   dequeue
    ```js
    /**
     * Take out next promise in queue or undefined
     * @returns { ProcessableItem<TReturn>[] | undefined }
     */
    new PromisePool().dequeue();
    ```
-   peek
    ```js
    /**
     * Take a peek at next promise to be processed in queue
     * @returns { ProcessableItem<TReturn> | undefined }
     */
    new PromisePool().peek();
    ```
-   isEmpty
    ```js
    /**
     * Check if there are processable items in queue
     * @returns { boolean }
     */
    new PromisePool().isEmpty();
    ```
-   getTaskMeta
    ```js
    /**
     * Take a peek at next promise to be processed in queue
     * @param { "updated" | "stopped" | "isProcessing" } opt
     * @returns { boolean }
     */
    new PromisePool().getTaskMeta('isProcessing');
    ```
-   setConcurrency
    ```js
    /**
     * @param { number } concurrency number to update
     * @returns { PromisePool<TReturn> }
     */
    new PromisePool().setConcurrency(100);
    ```
-   setStream
    ```js
    /**
     * @param { (_data: TReturn[]) => void } cb  Add or Update stream callback function
     * @returns { PromisePool<TReturn> }
     */
    new PromisePool().setStream((returns) => {
        //Do something
    });
    ```
-   stop
    ```js
    /**
     * Stops Currently running process excluding already processing task set
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    ```
-   process

    ```js
    /**
     * Starts the process
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    new PromisePool().process();
    ```
