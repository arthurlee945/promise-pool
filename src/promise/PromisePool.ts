import { EventEmitter } from 'events';

const emitterEvents = {
    stream: 'stream',
} as const;

//eslint-disable-next-line
type ProcessableItem<TReturn> = (..._args: any[]) => Promise<TReturn>;
type TaskReturnType<TReturn, TSettle> = TSettle extends true ? PromiseSettledResult<Awaited<TReturn>> : Awaited<TReturn>;
export type PromisePoolOpts<TReturn = unknown, TSettle extends boolean = true> = {
    concurrency?: number;
    processOnQueue?: boolean;
    settle?: TSettle;
    stream?: (_data: TReturn[]) => void;
};

export class PromisePool<TReturn = unknown, TSettle extends boolean = true> {
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
    readonly results: TaskReturnType<TReturn, TSettle>[] = [];
    /**
     * emitter to check if new item's been added to items.
     */
    private emitter: EventEmitter;
    /**
     * currently running promise
     */
    private runningProcess: Promise<TaskReturnType<TReturn, TSettle>[]> | null = null;
    /**
     * stream callback function
     */
    private stream: PromisePoolOpts<TReturn, TSettle>['stream'];
    /**
     * task meta to keep track on actions
     */
    private readonly taskMeta = { updated: false, stopped: false, isProcessing: false };
    /**
     * class settings
     */
    readonly settings: { stream: boolean; concurrency: number; settle: boolean };
    /**
     *
     * @param {ProcessableItem<TReturn>[]} items Promises to Process : (..._args: any[]) => Promise<TReturn>
     * @param {settings} settings Default | concurrency is 10, processOnQueue is true
     */
    constructor(items: ProcessableItem<TReturn>[] = [], opts: PromisePoolOpts<TReturn, TSettle> = {}) {
        this.items = items;
        this.stream = opts?.stream;
        this.emitter = new EventEmitter();
        this.settings = { settle: opts.settle ?? true, concurrency: opts.concurrency ?? 10, stream: !!this.stream };
        if (this.stream) this.emitter.on(emitterEvents.stream, this.stream);
    }

    //#region --------------------------QUEUE----------------------------
    /**
     * Add a promise to the queue
     * @param { ProcessableItem<TReturn> } items (..._args: any[]) => Promise<TReturn>
     * @returns {PromisePool}
     */
    enqueue<TProcess extends boolean = false>(
        _items: ProcessableItem<TReturn>[],
        _processOnQueue: TProcess
    ): TProcess extends true ? Promise<TaskReturnType<TReturn, TSettle>[]> : PromisePool<TReturn, TSettle>;
    enqueue(
        items: ProcessableItem<TReturn>[],
        processOnQueue = false
    ): Promise<TaskReturnType<TReturn, TSettle>[]> | PromisePool<TReturn, TSettle> {
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

    //#region -------------------------TASK META CHECK----------------------------
    /**
     * Check if there are processable items in queue
     * @returns { boolean }
     */
    isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check task meta
     * @returns { boolean }
     */
    checkTaskMeta(opt: keyof typeof this.taskMeta) {
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
    setStream(cb: NonNullable<PromisePoolOpts<TReturn, TSettle>['stream']>) {
        this.settings.stream = true;
        this.stream = cb;
        return this;
    }
    //#endregion

    //#region --------------------------PROCESSING----------------------------
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
    private async taskProcess() {
        if (this.isEmpty() || (this.runningProcess && !this.checkTaskMeta('updated'))) return this.results;
        if (!this.checkTaskMeta('updated')) this.results.splice(0, this.results.length);
        else this.taskMeta.updated = false;
        if (this.settings.settle) {
            this.results.push(...(await Promise.all([])));
        } else {
            this.results.push(...(await Promise.allSettled([])));
        }
        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            const taskPromises = this.tasks.map((t) => t());
            // if (this.settings.settle) this.results.push(...(await Promise.allSettled(taskPromises)));
            // else this.results.push(...(await Promise.all(taskPromises)));
            //FIX this
            this.results.push(
                ...((await (this.settings.settle ? Promise.allSettled(taskPromises) : Promise.all(taskPromises))) as TaskReturnType<
                    TReturn,
                    TSettle
                >[])
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
    //#endregion
}
