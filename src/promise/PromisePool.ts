import { EventEmitter } from 'events';

const emitterEvents = {
    stream: 'stream',
} as const;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessableItem<TReturn> = (..._args: any[]) => Promise<TReturn>;
type TaskReturnType<TReturn = unknown, TSettle = true> = TSettle extends true ? PromiseSettledResult<TReturn> : TReturn;
export type PromisePoolOpts<TReturn = unknown> = {
    concurrency?: number;
    settle?: boolean;
    stream?: (_returns: TReturn[]) => void;
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
    readonly results: TaskReturnType<TReturn, typeof this.settings.settle>[] = [];
    /**
     * emitter to check if new item's been added to items.
     */
    readonly emitter: EventEmitter;
    /**
     * currently running promise
     */
    private runningProcess: Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> | null = null;
    /**
     * stream callback function
     */
    private stream: PromisePoolOpts<TReturn>['stream'];
    /**
     * task meta to keep track on actions
     */
    readonly taskMeta: { updated: boolean; stopped: boolean; isProcessing: boolean };
    /**
     * class settings
     */
    readonly settings: { stream: boolean; concurrency: number; settle: boolean };
    /**
     *
     * @param {ProcessableItem<TReturn>[]} items Promises to Process : (..._args: any[]) => Promise<TReturn>
     * @param {settings} settings Default | concurrency is 10
     */
    constructor(items: ProcessableItem<TReturn>[] = [], opts: PromisePoolOpts<TReturn> = {}) {
        this.items = items;
        this.stream = opts.stream;
        this.taskMeta = { updated: false, stopped: false, isProcessing: false };
        this.emitter = new EventEmitter();
        this.settings = { settle: opts.settle ?? true, concurrency: opts.concurrency ?? 10, stream: !!this.stream };
        if (this.stream) this.emitter.on(emitterEvents.stream, this.stream);
    }

    //#region --------------------------QUEUE----------------------------
    /**
     * Add a promise to the queue
     * @param { ProcessableItem<TReturn> } items (..._args: any[]) => Promise<TReturn>
     * @returns {Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> | PromisePool}
     */
    enqueue<TProcess extends boolean = false>(
        _items: ProcessableItem<TReturn>[],
        _processOnQueue?: TProcess
    ): TProcess extends true ? Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> : PromisePool<TReturn>;
    enqueue(
        items: ProcessableItem<TReturn>[],
        processOnQueue = false
    ): Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> | PromisePool<TReturn> {
        this.items.push(...items);
        this.taskMeta.updated = !!this.runningProcess;
        if (processOnQueue) return !this.runningProcess ? this.process() : this.runningProcess;
        return this;
    }
    /**
     * Take out next promise in queue or undefined
     * @returns { ProcessableItem<TReturn>[] | undefined }
     */
    dequeue() {
        return this.items.splice(0, this.settings.concurrency);
    }
    /**
     * Take a peek at next promise to be processed in queue
     * @returns { ProcessableItem<TReturn> | undefined }
     */
    peek() {
        return this.items[0];
    }
    //#endregion

    //#region -------------------------META CHECK----------------------------
    /**
     * Check if there are processable items in queue
     * @returns { boolean }
     */
    isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check task meta
     * @param { "updated" | "stopped" | "isProcessing" } opt
     * @returns { boolean }
     */
    getTaskMeta(opt: keyof typeof this.taskMeta) {
        return this.taskMeta[opt];
    }
    //#endregion

    //#region --------------------------UPDATE SETTINGS----------------------------
    /**
     * @param { number } concurrency number to update
     * @returns { PromisePool<TReturn> }
     */
    setConcurrency(concurrency: number) {
        this.settings.concurrency = concurrency;
        return this;
    }
    /**
     * @param { (_data: TReturn[]) => void } cb  Add or Update stream callback function
     * @returns { PromisePool<TReturn> }
     */
    setStream(cb: NonNullable<PromisePoolOpts<TReturn>['stream']>) {
        this.settings.stream = true;
        this.stream = cb;
        return this;
    }
    //#endregion

    //#region --------------------------PROCESSING----------------------------
    /**
     * Stops Currently running process excluding already processing task set
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    stop() {
        this.taskMeta.stopped = true;
        return this.runningProcess;
    }
    private getResult() {
        this.taskMeta.updated = false;
        this.taskMeta.stopped = false;
        this.taskMeta.isProcessing = false;
        this.runningProcess = null;
        return this.results;
    }
    private async taskProcess() {
        if (this.isEmpty() || (this.runningProcess && !this.getTaskMeta('updated'))) return this.results;
        if (!this.getTaskMeta('updated')) this.results.splice(0, this.results.length);
        else this.taskMeta.updated = false;

        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            const taskPromises = this.tasks.map((t) => t());
            this.results.push(...(await (this.settings.settle ? Promise.allSettled(taskPromises) : Promise.all(taskPromises))));
            this.tasks.splice(0, this.settings.concurrency);
            if (this.settings.stream) this.emitter.emit(emitterEvents.stream, this.results);
            if (this.getTaskMeta('stopped')) return this.getResult();
            if (this.getTaskMeta('updated')) {
                await this.taskProcess();
                break;
            }
        }
        return this.getResult();
    }
    /**
     * Starts the process
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    process() {
        if (this.runningProcess) return this.runningProcess;
        this.taskMeta.isProcessing = true;
        return (this.runningProcess = this.taskProcess());
    }
    //#endregion
}
