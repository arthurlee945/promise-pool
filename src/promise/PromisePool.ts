// import {EventEmitter } from "events"
export class PromisePool<T> {
    private readonly items: T[];
    private concurrency: number;

    /**
     * default `concurrency: 10` and `items: []`.
     */
    constructor(items?: T[]) {
        this.items = items ?? [];
        this.concurrency = 10;
    }

    enqueue(item: T) {
        this.items.push(item);
        return this;
    }
    dequeue() {
        const item = this.items[0];
        if (!item) return;
        this.items.splice(0, 1);
        return item;
    }
    peek() {
        return this.items[0];
    }
}
