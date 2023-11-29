import { EventEmitter } from 'events';

const emitterEvents = {
    stream: 'stream',
    process: 'process',
} as const;

export type PromisePoolOpts<T> = { items?: Promise<T>[]; concurrency?: number; stream?: (_data: T[]) => void };

export class PromisePool<T = unknown> {
    /**
     * Currently running tasks
     */
    readonly tasks: Promise<T>[] = [];
    /**
     * results
     */
    readonly results: PromiseSettledResult<T>[] = [];
    /**
     * emitter to check if new item's been added to items.
     */
    private emitter: EventEmitter;
    /**
     * task meta data to keep track on actions
     */
    private taskMeta = { changed: false, stop: false };
    /**
     * The processable promises.
     */
    private readonly items: Promise<T>[];
    private readonly settings: { stream: boolean; concurrency: number };

    /**
     *
     * @param {Promise<T>[]} items Promises to Process in concurrency limit (Default: 10)
     */
    constructor({ items, concurrency, stream }: PromisePoolOpts<T>) {
        this.items = items ?? [];
        this.settings = { stream: !!stream, concurrency: concurrency ?? 10 };
        this.emitter = new EventEmitter();
        // this.emitter.on(emitterEvents.process, () => this.processTask);
        if (stream) this.emitter.on(emitterEvents.stream, stream);
    }

    //--------------------------QUEUE----------------------------
    /**
     * Add a promise to the queue
     * @param {Promise<T>} items
     * @returns {PromisePool}
     */
    enqueue(items: Promise<T>[]) {
        this.items.push(...items);
        this.taskMeta.changed = this.isProcessing();
        return this;
    }
    /**
     * Take out next promise in queue or undefined
     * @returns {Promise<unknown> | undefined}
     */
    dequeue() {
        return this.items.splice(0, this.settings.concurrency);
    }
    /**
     * Take a peek at next promise to be processed in queue
     * @returns {Promise<T> | undefined}
     */
    peek() {
        return this.items[0];
    }
    //-------------------------STATUS CHECK----------------------------
    /**
     * Check if there are processable items in queue
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check if there are  processing tasks
     * @returns {boolean}
     */
    isProcessing() {
        return this.tasks.length !== 0;
    }
    /**
     * Check if items to process changed
     * @returns {boolean}
     */
    itemChanged() {
        return this.taskMeta.changed;
    }
    /**
     * Check if process stop requested
     * @returns {boolean}
     */
    stopRequested() {
        return this.taskMeta.stop;
    }
    //--------------------------PROCESSING----------------------------
    /**
     *
     * @param {number} concurrency number to update
     */
    setConcurrency(concurrency: number) {
        this.settings.concurrency = concurrency;
    }
    stop() {
        this.taskMeta.stop = true;
    }
    private resetTaskMeta() {
        this.taskMeta.changed = false;
        this.taskMeta.stop = false;
    }
    // private processTask = async () => {
    //     if (!this.taskMeta.dPromise) throw new QPPError({ code: 'BAD_REQUEST', message: 'Deferred promise is not present' });
    //     if (this.isProcessing()) this.taskMeta.dPromise.reject('Invalid Request');
    //     console.log('Inside Emitter Event, before procesing');

    //     this.results.push(...(await Promise.allSettled(this.tasks)));
    //     console.log('after processing', this.results);
    //     this.tasks.splice(0, this.settings.concurrency);
    //     if (this.settings.stream) this.emitter.emit(emitterEvents.stream, this.results);
    //     this.taskMeta.dPromise.resolve({ continue: !this.taskMeta.changed, stop: this.taskMeta.stop });
    // };
    async process(): Promise<PromiseSettledResult<T>[]> {
        if (this.isEmpty() || (this.isProcessing() && !this.itemChanged())) return this.results;
        if (!this.itemChanged()) this.results.splice(0, this.results.length);
        else this.taskMeta.changed = false;
        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            this.results.push(...(await Promise.allSettled(this.tasks)));
            this.tasks.splice(0, this.settings.concurrency);
            if (this.settings.stream) this.emitter.emit(emitterEvents.stream, this.results);
            if (this.stopRequested()) {
                this.resetTaskMeta();
                return this.results;
            }
            if (this.itemChanged()) {
                await this.process();
                break;
            }
        }

        this.resetTaskMeta();
        return this.results;
    }
}
