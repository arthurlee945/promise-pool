import { EventEmitter } from 'events';

const emitterEvents = {
    stream: 'stream',
} as const;

//eslint-disable-next-line
type ProcessableItem<TReturn> = (..._args: any[]) => Promise<TReturn>;
type TaskReturnType<TReturn, TMode> = TMode extends 'allSettled' ? PromiseSettledResult<TReturn> : TReturn;
export type PromisePoolOpts<TReturn> = {
    concurrency?: number;
    processOnQueue?: boolean;
    mode?: 'all' | 'allSettled';
    stream?: (_data: TReturn[]) => void;
};

export class PromisePool<TReturn = unknown> {
    /**
     * The processable promises.
     */
    readonly items: ProcessableItem<TReturn>[];
    /**
     * Currently running tasks
     */
    readonly tasks: ProcessableItem<TReturn>[] = [];
    /**
     * results
     */
    readonly results: TaskReturnType<TReturn, typeof this.settings.mode>[] = [];
    /**
     * emitter to check if new item's been added to items.
     */
    private emitter: EventEmitter;
    /**
     * currently running promise
     */
    private runningProcess: Promise<TaskReturnType<TReturn, typeof this.settings.mode>[]> | null = null;
    /**
     * task meta to keep track on actions
     */
    private readonly taskMeta = { updated: false, stopped: false, isProcessing: false };
    /**
     * class settings
     */
    private readonly settings: { stream: boolean; concurrency: number; mode: 'all' | 'allSettled' };
    /**
     *
     * @param {ProcessableItem<TReturn>[]} items Promises to Process : (..._args: any[]) => Promise<TReturn>
     * @param {settings} settings Default | concurrency is 10, processOnQueue is true
     */
    constructor(items?: ProcessableItem<TReturn>[], opts?: PromisePoolOpts<TReturn>) {
        this.items = items ?? [];
        this.settings = { mode: opts?.mode ?? 'allSettled', concurrency: opts?.concurrency ?? 10, stream: !!opts?.stream };
        this.emitter = new EventEmitter();
        if (opts?.stream) this.emitter.on(emitterEvents.stream, opts.stream);
    }

    //--------------------------QUEUE----------------------------
    /**
     * Add a promise to the queue
     * @param {ProcessableItem<TReturn>} items (..._args: any[]) => Promise<TReturn>
     * @returns {PromisePool}
     */
    enqueue<TProcess extends boolean>(
        _items: ProcessableItem<TReturn>[],
        _processOnQueue?: TProcess
    ): TProcess extends true ? Promise<TaskReturnType<TReturn, typeof this.settings.mode>[]> : this;
    enqueue(
        items: ProcessableItem<TReturn>[],
        processOnQueue?: boolean
    ): Promise<TaskReturnType<TReturn, typeof this.settings.mode>[]> | PromisePool {
        this.items.push(...items);
        this.taskMeta.updated = !!this.runningProcess;
        if (processOnQueue) return !this.runningProcess ? this.process() : this.runningProcess;
        return this;
    }
    /**
     * Take out next promise in queue or undefined
     * @returns {ProcessableItem<TReturn>[] | undefined}
     */
    dequeue() {
        return this.items.splice(0, this.settings.concurrency);
    }
    /**
     * Take a peek at next promise to be processed in queue
     * @returns {ProcessableItem<TReturn> | undefined}
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
        return this;
    }
    stop() {
        this.taskMeta.stopped = true;
    }
    private getResult() {
        this.taskMeta.updated = false;
        this.taskMeta.stopped = false;
        this.taskMeta.isProcessing = false;
        this.runningProcess = null;
        return this.results;
    }
    private async taskProcess(): Promise<TaskReturnType<TReturn, typeof this.settings.mode>[]> {
        if (this.isEmpty() || (this.runningProcess && !this.checkTaskMeta('updated'))) return this.results;
        if (!this.checkTaskMeta('updated')) this.results.splice(0, this.results.length);
        else this.taskMeta.updated = false;

        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            const taskPromises = this.tasks.map((t) => t());
            this.results.push(
                ...(await (this.settings.mode === 'allSettled' ? Promise.allSettled(taskPromises) : Promise.all(taskPromises)))
            );
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
        this.taskMeta.isProcessing = true;
        return (this.runningProcess = this.taskProcess());
    }
}
