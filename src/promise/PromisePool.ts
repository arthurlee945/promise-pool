import { EventEmitter } from 'events';

const emitterEvents = {
    stream: 'stream',
} as const;

//eslint-disable-next-line
type ProcessableItem<T> = (..._args: any[]) => Promise<T>;
export type PromisePoolOpts<T> = { concurrency?: number; processOnQueue?: boolean; stream?: (_data: T[]) => void };

export class PromisePool<T = unknown> {
    /**
     * The processable promises.
     */
    readonly items: ProcessableItem<T>[];
    /**
     * Currently running tasks
     */
    readonly tasks: ProcessableItem<T>[] = [];
    /**
     * results
     */
    readonly results: PromiseSettledResult<T>[] = [];
    /**
     * emitter to check if new item's been added to items.
     */
    private emitter: EventEmitter;
    /**
     * currently running promise
     */
    private runningProcess: Promise<PromiseSettledResult<T>[]> | null = null;
    /**
     * task meta to keep track on actions
     */
    private readonly taskMeta = { updated: false, stopped: false };
    /**
     * class settings
     */
    private readonly settings: { stream: boolean; concurrency: number };
    /**
     *
     * @param {ProcessableItem<T>[]} items Promises to Process
     * @param {settings} settings Default | concurrency is 10, processOnQueue is true
     */
    constructor(items: ProcessableItem<T>[] = [], { concurrency, stream }: PromisePoolOpts<T>) {
        this.items = items ?? [];
        this.settings = { concurrency: concurrency ?? 10, stream: !!stream };
        this.emitter = new EventEmitter();
        if (stream) this.emitter.on(emitterEvents.stream, stream);
    }

    //--------------------------QUEUE----------------------------
    /**
     * Add a promise to the queue
     * @param {ProcessableItem<T>} items
     * @returns {PromisePool}
     */
    enqueue<TProcess extends boolean>(
        _items: ProcessableItem<T>[],
        _processOnQueue?: TProcess
    ): TProcess extends true ? Promise<PromiseSettledResult<T>[]> : this;
    enqueue(items: ProcessableItem<T>[], processOnQueue?: boolean): Promise<PromiseSettledResult<T>[]> | PromisePool {
        this.items.push(...items);
        this.taskMeta.updated = !!this.runningProcess;
        if (processOnQueue) return !this.runningProcess ? this.process() : this.runningProcess;
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
    //-------------------------TASK META CHECK----------------------------
    /**
     * Check if there are processable items in queue
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check task meta
     * @returns {boolean}
     */
    checkTaskMeta(opt: keyof typeof this.taskMeta) {
        return this.taskMeta[opt];
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
        this.taskMeta.stopped = true;
    }
    private getResult() {
        this.taskMeta.updated = false;
        this.taskMeta.stopped = false;
        this.runningProcess = null;
        return this.results;
    }
    private async taskProcess(): Promise<PromiseSettledResult<T>[]> {
        if (this.isEmpty() || (this.runningProcess && !this.checkTaskMeta('updated'))) return this.results;
        if (!this.checkTaskMeta('updated')) this.results.splice(0, this.results.length);
        else this.taskMeta.updated = false;
        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            this.results.push(...(await Promise.allSettled(this.tasks.map((t) => t()))));
            this.tasks.splice(0, this.settings.concurrency);
            if (this.settings.stream) this.emitter.emit(emitterEvents.stream, this.results);
            if (this.checkTaskMeta('stopped')) return this.getResult();
            if (this.checkTaskMeta('updated')) {
                await this.taskProcess();
                break;
            }
        }
        return this.getResult();
    }
    process() {
        return (this.runningProcess = this.taskProcess());
    }
}
