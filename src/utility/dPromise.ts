export type DeferredPromise<T> = {
    promise: Promise<T>;
    resolve: (_value: T | PromiseLike<T>) => void;
    reject: (_reason?: unknown) => void;
};
export function dPromise<T = void>(): DeferredPromise<T> {
    const deferred: Partial<DeferredPromise<T>> = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred as DeferredPromise<T>;
}
