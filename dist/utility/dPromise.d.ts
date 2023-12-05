export type DeferredPromise<T> = {
    promise: Promise<T>;
    resolve: (_value: T | PromiseLike<T>) => void;
    reject: (_reason?: unknown) => void;
};
export declare function dPromise<T = void>(): DeferredPromise<T>;
