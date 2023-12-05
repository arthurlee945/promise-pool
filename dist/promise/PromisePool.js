"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromisePool = void 0;
const events_1 = require("events");
const emitterEvents = {
    stream: 'stream',
};
class PromisePool {
    /**
     * The processable promises.
     */
    items;
    /**
     * Currently running tasks
     */
    tasks = [];
    /**
     * results
     */
    results = [];
    /**
     * emitter to check if new item's been added to items.
     */
    emitter;
    /**
     * currently running promise
     */
    runningProcess = null;
    /**
     * stream callback function
     */
    stream;
    /**
     * task meta to keep track on actions
     */
    taskMeta;
    /**
     * class settings
     */
    settings;
    /**
     *
     * @param {ProcessableItem<TReturn>[]} items Promises to Process : (..._args: any[]) => Promise<TReturn>
     * @param {settings} settings Default | concurrency is 10
     */
    constructor(items = [], opts = {}) {
        this.items = items;
        this.stream = opts.stream;
        this.taskMeta = { updated: false, stopped: false, isProcessing: false };
        this.emitter = new events_1.EventEmitter();
        this.settings = { settle: opts.settle ?? true, concurrency: opts.concurrency ?? 10, stream: !!this.stream };
        if (this.stream)
            this.emitter.on(emitterEvents.stream, this.stream);
    }
    enqueue(items, processOnQueue = false) {
        this.items.push(...items);
        this.taskMeta.updated = !!this.runningProcess;
        if (processOnQueue)
            return !this.runningProcess ? this.process() : this.runningProcess;
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
    getTaskMeta(opt) {
        return this.taskMeta[opt];
    }
    //#endregion
    //#region --------------------------UPDATE SETTINGS----------------------------
    /**
     * @param { number } concurrency number to update
     * @returns { PromisePool<TReturn> }
     */
    setConcurrency(concurrency) {
        this.settings.concurrency = concurrency;
        return this;
    }
    /**
     * @param { (_data: TReturn[]) => void } cb  Add or Update stream callback function
     * @returns { PromisePool<TReturn> }
     */
    setStream(cb) {
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
    getResult() {
        this.taskMeta.updated = false;
        this.taskMeta.stopped = false;
        this.taskMeta.isProcessing = false;
        this.runningProcess = null;
        return this.results;
    }
    async taskProcess() {
        if (this.isEmpty() || (this.runningProcess && !this.getTaskMeta('updated')))
            return this.results;
        if (!this.getTaskMeta('updated'))
            this.results.splice(0, this.results.length);
        else
            this.taskMeta.updated = false;
        const loopCount = Math.ceil(this.items.length / this.settings.concurrency);
        for (let i = 0; i < loopCount; i++) {
            this.tasks.push(...this.dequeue());
            const taskPromises = this.tasks.map((t) => t());
            this.results.push(...(await (this.settings.settle ? Promise.allSettled(taskPromises) : Promise.all(taskPromises))));
            this.tasks.splice(0, this.settings.concurrency);
            if (this.settings.stream)
                this.emitter.emit(emitterEvents.stream, this.results);
            if (this.getTaskMeta('stopped'))
                return this.getResult();
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
        if (this.runningProcess)
            return this.runningProcess;
        this.taskMeta.isProcessing = true;
        return (this.runningProcess = this.taskProcess());
    }
}
exports.PromisePool = PromisePool;
//# sourceMappingURL=PromisePool.js.map