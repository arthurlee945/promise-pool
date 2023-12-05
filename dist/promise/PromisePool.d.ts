/// <reference types="node" />
import { EventEmitter } from 'events';
type ProcessableItem<TReturn> = (..._args: any[]) => Promise<TReturn>;
type TaskReturnType<TReturn = unknown, TSettle = true> = TSettle extends true ? PromiseSettledResult<TReturn> : TReturn;
export type PromisePoolOpts<TReturn = unknown> = {
    concurrency?: number;
    settle?: boolean;
    stream?: (_returns: TReturn[]) => void;
};
export declare class PromisePool<TReturn = unknown> {
    /**
     * The processable promises.
     */
    readonly items: ProcessableItem<TReturn>[];
    /**
     * Currently running tasks
     */
    readonly tasks: ProcessableItem<TReturn>[];
    /**
     * results
     */
    readonly results: TaskReturnType<TReturn, typeof this.settings.settle>[];
    /**
     * emitter to check if new item's been added to items.
     */
    readonly emitter: EventEmitter;
    /**
     * currently running promise
     */
    private runningProcess;
    /**
     * stream callback function
     */
    private stream;
    /**
     * task meta to keep track on actions
     */
    readonly taskMeta: {
        updated: boolean;
        stopped: boolean;
        isProcessing: boolean;
    };
    /**
     * class settings
     */
    readonly settings: {
        stream: boolean;
        concurrency: number;
        settle: boolean;
    };
    /**
     *
     * @param {ProcessableItem<TReturn>[]} items Promises to Process : (..._args: any[]) => Promise<TReturn>
     * @param {settings} settings Default | concurrency is 10
     */
    constructor(items?: ProcessableItem<TReturn>[], opts?: PromisePoolOpts<TReturn>);
    /**
     * Add a promise to the queue
     * @param { ProcessableItem<TReturn> } items (..._args: any[]) => Promise<TReturn>
     * @returns {Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> | PromisePool}
     */
    enqueue<TProcess extends boolean = false>(_items: ProcessableItem<TReturn>[], _processOnQueue?: TProcess): TProcess extends true ? Promise<TaskReturnType<TReturn, typeof this.settings.settle>[]> : PromisePool<TReturn>;
    /**
     * Take out next promise in queue or undefined
     * @returns { ProcessableItem<TReturn>[] | undefined }
     */
    dequeue(): ProcessableItem<TReturn>[];
    /**
     * Take a peek at next promise to be processed in queue
     * @returns { ProcessableItem<TReturn> | undefined }
     */
    peek(): ProcessableItem<TReturn> | undefined;
    /**
     * Check if there are processable items in queue
     * @returns { boolean }
     */
    isEmpty(): boolean;
    /**
     * Check task meta
     * @param { "updated" | "stopped" | "isProcessing" } opt
     * @returns { boolean }
     */
    getTaskMeta(opt: keyof typeof this.taskMeta): boolean;
    /**
     * @param { number } concurrency number to update
     * @returns { PromisePool<TReturn> }
     */
    setConcurrency(concurrency: number): this;
    /**
     * @param { (_data: TReturn[]) => void } cb  Add or Update stream callback function
     * @returns { PromisePool<TReturn> }
     */
    setStream(cb: NonNullable<PromisePoolOpts<TReturn>['stream']>): this;
    /**
     * Stops Currently running process excluding already processing task set
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    stop(): Promise<(TReturn | PromiseSettledResult<TReturn>)[]> | null;
    private getResult;
    private taskProcess;
    /**
     * Starts the process
     * @returns {Promise<(TReturn | PromiseSettledResult<TReturn>)[]>}
     */
    process(): Promise<(TReturn | PromiseSettledResult<TReturn>)[]>;
}
export {};
