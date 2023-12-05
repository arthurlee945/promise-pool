"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dPromise = void 0;
function dPromise() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}
exports.dPromise = dPromise;
//# sourceMappingURL=dPromise.js.map