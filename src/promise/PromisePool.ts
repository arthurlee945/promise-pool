import { EventEmitter } from 'events';
import { dPromise, type DeferredPromise } from "../utility/dPromise";

const emitterEvents = {
    stream: 'stream',
    processRequest: 'processRequest',
} as const;

export type PromisePoolOpts<T> = { items: Promise<T>[]; concurrency?: number; stream?: (_data: T[]) => void };

export class PromisePool<T> {
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
    private taskPromise?: DeferredPromise<{ continue: boolean; stop: boolean }>;
    private taskSettings = { changed: false, stopRequested: false };
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
        this.emitter.on(emitterEvents.processRequest, () => this.processTask);
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
        this.taskSettings.changed = true;
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
        return this.tasks.length === 0;
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
        this.taskSettings.stopRequested = true;
    }
    private processTask = async () => {
        if (!this.taskPromise) return;
        if (this.isProcessing()) this.taskPromise.reject('Invalid Request');

        this.results.push(...(await Promise.allSettled(this.tasks)));
        this.tasks.splice(0, this.settings.concurrency);
        if (this.settings.stream) this.emitter.emit(emitterEvents.stream, this.results);
        this.taskPromise.resolve({ continue: !this.taskSettings.changed, stop: this.taskSettings.stopRequested });
    };
    async process(): Promise<PromiseSettledResult<T>[]> {
        if (this.isEmpty() || this.isProcessing()) return this.results;

        for (let i = 0; i < Math.ceil(this.items.length / this.settings.concurrency); i++) {
            this.tasks.push(...this.dequeue());
            this.taskPromise = dPromise();
            this.emitter.emit(emitterEvents.processRequest);
            const taskResult = await this.taskPromise.promise;

            if (taskResult.stop) {
                this.taskSettings.changed = false;
                this.taskSettings.stopRequested = false;
                return this.results;
            }

            if (!taskResult.continue) {
                this.taskSettings.changed = false;
                await this.process();
                break;
            }
        }

        this.taskSettings.changed = false;
        this.taskSettings.stopRequested = false;
        return this.results;
    }
}
