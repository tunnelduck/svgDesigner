(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var root_1 = require('./util/root');
var observable_1 = require('./symbol/observable');
var toSubscriber_1 = require('./util/toSubscriber');
/**
 * A representation of any set of values over any amount of time. This the most basic building block
 * of RxJS.
 *
 * @class Observable<T>
 */
var Observable = (function () {
    /**
     * @constructor
     * @param {Function} subscribe the function that is  called when the Observable is
     * initially subscribed to. This function is given a Subscriber, to which new values
     * can be `next`ed, or an `error` method can be called to raise an error, or
     * `complete` can be called to notify of a successful completion.
     */
    function Observable(subscribe) {
        this._isScalar = false;
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    /**
     * Creates a new Observable, with this Observable as the source, and the passed
     * operator defined as the new observable's operator.
     * @method lift
     * @param {Operator} operator the operator defining the operation to take on the observable
     * @return {Observable} a new observable with the Operator applied
     */
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    /**
     * Registers handlers for handling emitted values, error and completions from the observable, and
     *  executes the observable's subscriber function, which will take action to set up the underlying data stream
     * @method subscribe
     * @param {PartialObserver|Function} observerOrNext (optional) either an observer defining all functions to be called,
     *  or the first of three possible handlers, which is the handler for each value emitted from the observable.
     * @param {Function} error (optional) a handler for a terminal event resulting from an error. If no error handler is provided,
     *  the error will be thrown as unhandled
     * @param {Function} complete (optional) a handler for a terminal event resulting from successful completion.
     * @return {ISubscription} a subscription reference to the registered handlers
     */
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var operator = this.operator;
        var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
        sink.add(operator ? operator.call(sink, this) : this._subscribe(sink));
        if (sink.syncErrorThrowable) {
            sink.syncErrorThrowable = false;
            if (sink.syncErrorThrown) {
                throw sink.syncErrorValue;
            }
        }
        return sink;
    };
    /**
     * @method forEach
     * @param {Function} next a handler for each value emitted by the observable
     * @param {PromiseConstructor} [PromiseCtor] a constructor function used to instantiate the Promise
     * @return {Promise} a promise that either resolves on observable completion or
     *  rejects with the handled error
     */
    Observable.prototype.forEach = function (next, PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
            if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
                PromiseCtor = root_1.root.Rx.config.Promise;
            }
            else if (root_1.root.Promise) {
                PromiseCtor = root_1.root.Promise;
            }
        }
        if (!PromiseCtor) {
            throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
            var subscription = _this.subscribe(function (value) {
                if (subscription) {
                    // if there is a subscription, then we can surmise
                    // the next handling is asynchronous. Any errors thrown
                    // need to be rejected explicitly and unsubscribe must be
                    // called manually
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscription.unsubscribe();
                    }
                }
                else {
                    // if there is NO subscription, then we're getting a nexted
                    // value synchronously during subscription. We can just call it.
                    // If it errors, Observable's `subscribe` imple will ensure the
                    // unsubscription logic is called, then synchronously rethrow the error.
                    // After that, Promise will trap the error and send it
                    // down the rejection path.
                    next(value);
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        return this.source.subscribe(subscriber);
    };
    /**
     * An interop point defined by the es7-observable spec https://github.com/zenparsing/es-observable
     * @method Symbol.observable
     * @return {Observable} this instance of the observable
     */
    Observable.prototype[observable_1.$$observable] = function () {
        return this;
    };
    // HACK: Since TypeScript inherits static properties too, we have to
    // fight against TypeScript here so Subject can have a different static create signature
    /**
     * Creates a new cold Observable by calling the Observable constructor
     * @static true
     * @owner Observable
     * @method create
     * @param {Function} subscribe? the subscriber function to be passed to the Observable constructor
     * @return {Observable} a new cold observable
     */
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
exports.Observable = Observable;

},{"./symbol/observable":7,"./util/root":15,"./util/toSubscriber":17}],2:[function(require,module,exports){
"use strict";
exports.empty = {
    isUnsubscribed: true,
    next: function (value) { },
    error: function (err) { throw err; },
    complete: function () { }
};

},{}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observable_1 = require('./Observable');
var Subscriber_1 = require('./Subscriber');
var Subscription_1 = require('./Subscription');
var SubjectSubscription_1 = require('./SubjectSubscription');
var rxSubscriber_1 = require('./symbol/rxSubscriber');
var throwError_1 = require('./util/throwError');
var ObjectUnsubscribedError_1 = require('./util/ObjectUnsubscribedError');
/**
 * @class Subject<T>
 */
var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject(destination, source) {
        _super.call(this);
        this.destination = destination;
        this.source = source;
        this.observers = [];
        this.isUnsubscribed = false;
        this.isStopped = false;
        this.hasErrored = false;
        this.dispatching = false;
        this.hasCompleted = false;
        this.source = source;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new Subject(this.destination || this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype.add = function (subscription) {
        return Subscription_1.Subscription.prototype.add.call(this, subscription);
    };
    Subject.prototype.remove = function (subscription) {
        Subscription_1.Subscription.prototype.remove.call(this, subscription);
    };
    Subject.prototype.unsubscribe = function () {
        Subscription_1.Subscription.prototype.unsubscribe.call(this);
    };
    Subject.prototype._subscribe = function (subscriber) {
        if (this.source) {
            return this.source.subscribe(subscriber);
        }
        else {
            if (subscriber.isUnsubscribed) {
                return;
            }
            else if (this.hasErrored) {
                return subscriber.error(this.errorValue);
            }
            else if (this.hasCompleted) {
                return subscriber.complete();
            }
            this.throwIfUnsubscribed();
            var subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
            this.observers.push(subscriber);
            return subscription;
        }
    };
    Subject.prototype._unsubscribe = function () {
        this.source = null;
        this.isStopped = true;
        this.observers = null;
        this.destination = null;
    };
    Subject.prototype.next = function (value) {
        this.throwIfUnsubscribed();
        if (this.isStopped) {
            return;
        }
        this.dispatching = true;
        this._next(value);
        this.dispatching = false;
        if (this.hasErrored) {
            this._error(this.errorValue);
        }
        else if (this.hasCompleted) {
            this._complete();
        }
    };
    Subject.prototype.error = function (err) {
        this.throwIfUnsubscribed();
        if (this.isStopped) {
            return;
        }
        this.isStopped = true;
        this.hasErrored = true;
        this.errorValue = err;
        if (this.dispatching) {
            return;
        }
        this._error(err);
    };
    Subject.prototype.complete = function () {
        this.throwIfUnsubscribed();
        if (this.isStopped) {
            return;
        }
        this.isStopped = true;
        this.hasCompleted = true;
        if (this.dispatching) {
            return;
        }
        this._complete();
    };
    Subject.prototype.asObservable = function () {
        var observable = new SubjectObservable(this);
        return observable;
    };
    Subject.prototype._next = function (value) {
        if (this.destination) {
            this.destination.next(value);
        }
        else {
            this._finalNext(value);
        }
    };
    Subject.prototype._finalNext = function (value) {
        var index = -1;
        var observers = this.observers.slice(0);
        var len = observers.length;
        while (++index < len) {
            observers[index].next(value);
        }
    };
    Subject.prototype._error = function (err) {
        if (this.destination) {
            this.destination.error(err);
        }
        else {
            this._finalError(err);
        }
    };
    Subject.prototype._finalError = function (err) {
        var index = -1;
        var observers = this.observers;
        // optimization to block our SubjectSubscriptions from
        // splicing themselves out of the observers list one by one.
        this.observers = null;
        this.isUnsubscribed = true;
        if (observers) {
            var len = observers.length;
            while (++index < len) {
                observers[index].error(err);
            }
        }
        this.isUnsubscribed = false;
        this.unsubscribe();
    };
    Subject.prototype._complete = function () {
        if (this.destination) {
            this.destination.complete();
        }
        else {
            this._finalComplete();
        }
    };
    Subject.prototype._finalComplete = function () {
        var index = -1;
        var observers = this.observers;
        // optimization to block our SubjectSubscriptions from
        // splicing themselves out of the observers list one by one.
        this.observers = null;
        this.isUnsubscribed = true;
        if (observers) {
            var len = observers.length;
            while (++index < len) {
                observers[index].complete();
            }
        }
        this.isUnsubscribed = false;
        this.unsubscribe();
    };
    Subject.prototype.throwIfUnsubscribed = function () {
        if (this.isUnsubscribed) {
            throwError_1.throwError(new ObjectUnsubscribedError_1.ObjectUnsubscribedError());
        }
    };
    Subject.prototype[rxSubscriber_1.$$rxSubscriber] = function () {
        return new Subscriber_1.Subscriber(this);
    };
    Subject.create = function (destination, source) {
        return new Subject(destination, source);
    };
    return Subject;
}(Observable_1.Observable));
exports.Subject = Subject;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SubjectObservable = (function (_super) {
    __extends(SubjectObservable, _super);
    function SubjectObservable(source) {
        _super.call(this);
        this.source = source;
    }
    return SubjectObservable;
}(Observable_1.Observable));

},{"./Observable":1,"./SubjectSubscription":4,"./Subscriber":5,"./Subscription":6,"./symbol/rxSubscriber":8,"./util/ObjectUnsubscribedError":9,"./util/throwError":16}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subscription_1 = require('./Subscription');
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SubjectSubscription = (function (_super) {
    __extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, observer) {
        _super.call(this);
        this.subject = subject;
        this.observer = observer;
        this.isUnsubscribed = false;
    }
    SubjectSubscription.prototype.unsubscribe = function () {
        if (this.isUnsubscribed) {
            return;
        }
        this.isUnsubscribed = true;
        var subject = this.subject;
        var observers = subject.observers;
        this.subject = null;
        if (!observers || observers.length === 0 || subject.isUnsubscribed) {
            return;
        }
        var subscriberIndex = observers.indexOf(this.observer);
        if (subscriberIndex !== -1) {
            observers.splice(subscriberIndex, 1);
        }
    };
    return SubjectSubscription;
}(Subscription_1.Subscription));
exports.SubjectSubscription = SubjectSubscription;

},{"./Subscription":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var isFunction_1 = require('./util/isFunction');
var Subscription_1 = require('./Subscription');
var rxSubscriber_1 = require('./symbol/rxSubscriber');
var Observer_1 = require('./Observer');
/**
 * Implements the {@link Observer} interface and extends the
 * {@link Subscription} class. While the {@link Observer} is the public API for
 * consuming the values of an {@link Observable}, all Observers get converted to
 * a Subscriber, in order to provide Subscription-like capabilities such as
 * `unsubscribe`. Subscriber is a common type in RxJS, and crucial for
 * implementing operators, but it is rarely used as a public API.
 *
 * @class Subscriber<T>
 */
var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    /**
     * @param {Observer|function(value: T): void} [destinationOrNext] A partially
     * defined Observer or a `next` callback function.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     */
    function Subscriber(destinationOrNext, error, complete) {
        _super.call(this);
        this.syncErrorValue = null;
        this.syncErrorThrown = false;
        this.syncErrorThrowable = false;
        this.isStopped = false;
        switch (arguments.length) {
            case 0:
                this.destination = Observer_1.empty;
                break;
            case 1:
                if (!destinationOrNext) {
                    this.destination = Observer_1.empty;
                    break;
                }
                if (typeof destinationOrNext === 'object') {
                    if (destinationOrNext instanceof Subscriber) {
                        this.destination = destinationOrNext;
                        this.destination.add(this);
                    }
                    else {
                        this.syncErrorThrowable = true;
                        this.destination = new SafeSubscriber(this, destinationOrNext);
                    }
                    break;
                }
            default:
                this.syncErrorThrowable = true;
                this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
                break;
        }
    }
    /**
     * A static factory for a Subscriber, given a (potentially partial) definition
     * of an Observer.
     * @param {function(x: ?T): void} [next] The `next` callback of an Observer.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     * @return {Subscriber<T>} A Subscriber wrapping the (partially defined)
     * Observer represented by the given arguments.
     */
    Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
    };
    /**
     * The {@link Observer} callback to receive notifications of type `next` from
     * the Observable, with a value. The Observable may call this method 0 or more
     * times.
     * @param {T} [value] The `next` value.
     * @return {void}
     */
    Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
            this._next(value);
        }
    };
    /**
     * The {@link Observer} callback to receive notifications of type `error` from
     * the Observable, with an attached {@link Error}. Notifies the Observer that
     * the Observable has experienced an error condition.
     * @param {any} [err] The `error` exception.
     * @return {void}
     */
    Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            this.isStopped = true;
            this._error(err);
        }
    };
    /**
     * The {@link Observer} callback to receive a valueless notification of type
     * `complete` from the Observable. Notifies the Observer that the Observable
     * has finished sending push-based notifications.
     * @return {void}
     */
    Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (this.isUnsubscribed) {
            return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
    };
    Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
    };
    Subscriber.prototype[rxSubscriber_1.$$rxSubscriber] = function () {
        return this;
    };
    return Subscriber;
}(Subscription_1.Subscription));
exports.Subscriber = Subscriber;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(_parent, observerOrNext, error, complete) {
        _super.call(this);
        this._parent = _parent;
        var next;
        var context = this;
        if (isFunction_1.isFunction(observerOrNext)) {
            next = observerOrNext;
        }
        else if (observerOrNext) {
            context = observerOrNext;
            next = observerOrNext.next;
            error = observerOrNext.error;
            complete = observerOrNext.complete;
            if (isFunction_1.isFunction(context.unsubscribe)) {
                this.add(context.unsubscribe.bind(context));
            }
            context.unsubscribe = this.unsubscribe.bind(this);
        }
        this._context = context;
        this._next = next;
        this._error = error;
        this._complete = complete;
    }
    SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
            var _parent = this._parent;
            if (!_parent.syncErrorThrowable) {
                this.__tryOrUnsub(this._next, value);
            }
            else if (this.__tryOrSetError(_parent, this._next, value)) {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _parent = this._parent;
            if (this._error) {
                if (!_parent.syncErrorThrowable) {
                    this.__tryOrUnsub(this._error, err);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parent, this._error, err);
                    this.unsubscribe();
                }
            }
            else if (!_parent.syncErrorThrowable) {
                this.unsubscribe();
                throw err;
            }
            else {
                _parent.syncErrorValue = err;
                _parent.syncErrorThrown = true;
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.complete = function () {
        if (!this.isStopped) {
            var _parent = this._parent;
            if (this._complete) {
                if (!_parent.syncErrorThrowable) {
                    this.__tryOrUnsub(this._complete);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parent, this._complete);
                    this.unsubscribe();
                }
            }
            else {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            this.unsubscribe();
            throw err;
        }
    };
    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            parent.syncErrorValue = err;
            parent.syncErrorThrown = true;
            return true;
        }
        return false;
    };
    SafeSubscriber.prototype._unsubscribe = function () {
        var _parent = this._parent;
        this._context = null;
        this._parent = null;
        _parent.unsubscribe();
    };
    return SafeSubscriber;
}(Subscriber));

},{"./Observer":2,"./Subscription":6,"./symbol/rxSubscriber":8,"./util/isFunction":13}],6:[function(require,module,exports){
"use strict";
var isArray_1 = require('./util/isArray');
var isObject_1 = require('./util/isObject');
var isFunction_1 = require('./util/isFunction');
var tryCatch_1 = require('./util/tryCatch');
var errorObject_1 = require('./util/errorObject');
var UnsubscriptionError_1 = require('./util/UnsubscriptionError');
/**
 * Represents a disposable resource, such as the execution of an Observable. A
 * Subscription has one important method, `unsubscribe`, that takes no argument
 * and just disposes the resource held by the subscription.
 *
 * Additionally, subscriptions may be grouped together through the `add()`
 * method, which will attach a child Subscription to the current Subscription.
 * When a Subscription is unsubscribed, all its children (and its grandchildren)
 * will be unsubscribed as well.
 *
 * @class Subscription
 */
var Subscription = (function () {
    /**
     * @param {function(): void} [unsubscribe] A function describing how to
     * perform the disposal of resources when the `unsubscribe` method is called.
     */
    function Subscription(unsubscribe) {
        /**
         * A flag to indicate whether this Subscription has already been unsubscribed.
         * @type {boolean}
         */
        this.isUnsubscribed = false;
        if (unsubscribe) {
            this._unsubscribe = unsubscribe;
        }
    }
    /**
     * Disposes the resources held by the subscription. May, for instance, cancel
     * an ongoing Observable execution or cancel any other type of work that
     * started when the Subscription was created.
     * @return {void}
     */
    Subscription.prototype.unsubscribe = function () {
        var hasErrors = false;
        var errors;
        if (this.isUnsubscribed) {
            return;
        }
        this.isUnsubscribed = true;
        var _a = this, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this._subscriptions = null;
        if (isFunction_1.isFunction(_unsubscribe)) {
            var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
            if (trial === errorObject_1.errorObject) {
                hasErrors = true;
                (errors = errors || []).push(errorObject_1.errorObject.e);
            }
        }
        if (isArray_1.isArray(_subscriptions)) {
            var index = -1;
            var len = _subscriptions.length;
            while (++index < len) {
                var sub = _subscriptions[index];
                if (isObject_1.isObject(sub)) {
                    var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
                    if (trial === errorObject_1.errorObject) {
                        hasErrors = true;
                        errors = errors || [];
                        var err = errorObject_1.errorObject.e;
                        if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                            errors = errors.concat(err.errors);
                        }
                        else {
                            errors.push(err);
                        }
                    }
                }
            }
        }
        if (hasErrors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
        }
    };
    /**
     * Adds a tear down to be called during the unsubscribe() of this
     * Subscription.
     *
     * If the tear down being added is a subscription that is already
     * unsubscribed, is the same reference `add` is being called on, or is
     * `Subscription.EMPTY`, it will not be added.
     *
     * If this subscription is already in an `isUnsubscribed` state, the passed
     * tear down logic will be executed immediately.
     *
     * @param {TeardownLogic} teardown The additional logic to execute on
     * teardown.
     * @return {Subscription} Returns the Subscription used or created to be
     * added to the inner subscriptions list. This Subscription can be used with
     * `remove()` to remove the passed teardown logic from the inner subscriptions
     * list.
     */
    Subscription.prototype.add = function (teardown) {
        if (!teardown || (teardown === this) || (teardown === Subscription.EMPTY)) {
            return;
        }
        var sub = teardown;
        switch (typeof teardown) {
            case 'function':
                sub = new Subscription(teardown);
            case 'object':
                if (sub.isUnsubscribed || typeof sub.unsubscribe !== 'function') {
                    break;
                }
                else if (this.isUnsubscribed) {
                    sub.unsubscribe();
                }
                else {
                    (this._subscriptions || (this._subscriptions = [])).push(sub);
                }
                break;
            default:
                throw new Error('Unrecognized teardown ' + teardown + ' added to Subscription.');
        }
        return sub;
    };
    /**
     * Removes a Subscription from the internal list of subscriptions that will
     * unsubscribe during the unsubscribe process of this Subscription.
     * @param {Subscription} subscription The subscription to remove.
     * @return {void}
     */
    Subscription.prototype.remove = function (subscription) {
        // HACK: This might be redundant because of the logic in `add()`
        if (subscription == null || (subscription === this) || (subscription === Subscription.EMPTY)) {
            return;
        }
        var subscriptions = this._subscriptions;
        if (subscriptions) {
            var subscriptionIndex = subscriptions.indexOf(subscription);
            if (subscriptionIndex !== -1) {
                subscriptions.splice(subscriptionIndex, 1);
            }
        }
    };
    Subscription.EMPTY = (function (empty) {
        empty.isUnsubscribed = true;
        return empty;
    }(new Subscription()));
    return Subscription;
}());
exports.Subscription = Subscription;

},{"./util/UnsubscriptionError":10,"./util/errorObject":11,"./util/isArray":12,"./util/isFunction":13,"./util/isObject":14,"./util/tryCatch":18}],7:[function(require,module,exports){
"use strict";
var root_1 = require('../util/root');
var Symbol = root_1.root.Symbol;
if (typeof Symbol === 'function') {
    if (Symbol.observable) {
        exports.$$observable = Symbol.observable;
    }
    else {
        if (typeof Symbol.for === 'function') {
            exports.$$observable = Symbol.for('observable');
        }
        else {
            exports.$$observable = Symbol('observable');
        }
        Symbol.observable = exports.$$observable;
    }
}
else {
    exports.$$observable = '@@observable';
}

},{"../util/root":15}],8:[function(require,module,exports){
"use strict";
var root_1 = require('../util/root');
var Symbol = root_1.root.Symbol;
exports.$$rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ?
    Symbol.for('rxSubscriber') : '@@rxSubscriber';

},{"../util/root":15}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when an action is invalid because the object has been
 * unsubscribed.
 *
 * @see {@link Subject}
 * @see {@link BehaviorSubject}
 *
 * @class ObjectUnsubscribedError
 */
var ObjectUnsubscribedError = (function (_super) {
    __extends(ObjectUnsubscribedError, _super);
    function ObjectUnsubscribedError() {
        _super.call(this, 'object unsubscribed');
        this.name = 'ObjectUnsubscribedError';
    }
    return ObjectUnsubscribedError;
}(Error));
exports.ObjectUnsubscribedError = ObjectUnsubscribedError;

},{}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when one or more errors have occurred during the
 * `unsubscribe` of a {@link Subscription}.
 */
var UnsubscriptionError = (function (_super) {
    __extends(UnsubscriptionError, _super);
    function UnsubscriptionError(errors) {
        _super.call(this);
        this.errors = errors;
        this.name = 'UnsubscriptionError';
        this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return ((i + 1) + ") " + err.toString()); }).join('\n') : '';
    }
    return UnsubscriptionError;
}(Error));
exports.UnsubscriptionError = UnsubscriptionError;

},{}],11:[function(require,module,exports){
"use strict";
// typeof any so that it we don't have to cast when comparing a result to the error object
exports.errorObject = { e: {} };

},{}],12:[function(require,module,exports){
"use strict";
exports.isArray = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });

},{}],13:[function(require,module,exports){
"use strict";
function isFunction(x) {
    return typeof x === 'function';
}
exports.isFunction = isFunction;

},{}],14:[function(require,module,exports){
"use strict";
function isObject(x) {
    return x != null && typeof x === 'object';
}
exports.isObject = isObject;

},{}],15:[function(require,module,exports){
(function (global){
"use strict";
var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
};
exports.root = (objectTypes[typeof self] && self) || (objectTypes[typeof window] && window);
/* tslint:disable:no-unused-variable */
var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
var freeGlobal = objectTypes[typeof global] && global;
if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    exports.root = freeGlobal;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],16:[function(require,module,exports){
"use strict";
function throwError(e) { throw e; }
exports.throwError = throwError;

},{}],17:[function(require,module,exports){
"use strict";
var Subscriber_1 = require('../Subscriber');
var rxSubscriber_1 = require('../symbol/rxSubscriber');
function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver && typeof nextOrObserver === 'object') {
        if (nextOrObserver instanceof Subscriber_1.Subscriber) {
            return nextOrObserver;
        }
        else if (typeof nextOrObserver[rxSubscriber_1.$$rxSubscriber] === 'function') {
            return nextOrObserver[rxSubscriber_1.$$rxSubscriber]();
        }
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
}
exports.toSubscriber = toSubscriber;

},{"../Subscriber":5,"../symbol/rxSubscriber":8}],18:[function(require,module,exports){
"use strict";
var errorObject_1 = require('./errorObject');
var tryCatchTarget;
function tryCatcher() {
    try {
        return tryCatchTarget.apply(this, arguments);
    }
    catch (e) {
        errorObject_1.errorObject.e = e;
        return errorObject_1.errorObject;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}
exports.tryCatch = tryCatch;
;

},{"./errorObject":11}],19:[function(require,module,exports){
"use strict";
var AppController = (function () {
    function AppController($scope) {
        this.$scope = $scope;
    }
    return AppController;
}());
exports.__esModule = true;
exports["default"] = AppController;
},{}],20:[function(require,module,exports){
"use strict";
var DesignRegionComponent = (function () {
    function DesignRegionComponent() {
    }
    return DesignRegionComponent;
}());
exports.DesignRegionComponent = DesignRegionComponent;
},{}],21:[function(require,module,exports){
"use strict";
var design_region_svg_1 = require('./svg/design-region-svg');
var DesignRegionDirective = (function () {
    function DesignRegionDirective() {
        return {
            template: "",
            link: function (scope, element, attrs) {
                var svg = new design_region_svg_1["default"](element);
            }
        };
    }
    return DesignRegionDirective;
}());
exports.__esModule = true;
exports["default"] = DesignRegionDirective;
},{"./svg/design-region-svg":23}],22:[function(require,module,exports){
"use strict";
var app_controller_1 = require('./app.controller');
var design_region_component_1 = require('./design-region.component');
var design_region_directive_1 = require('./design-region.directive');
(function () {
    angular.module('svgDesignerApp', [])
        .controller('appController', app_controller_1["default"])
        .component('designregion', {
        controller: design_region_component_1.DesignRegionComponent,
        template: "<design-region></design-region>"
    })
        .directive('designRegion', [design_region_directive_1["default"]]);
})();
},{"./app.controller":19,"./design-region.component":20,"./design-region.directive":21}],23:[function(require,module,exports){
"use strict";
var handle_drawer_1 = require('./handle-drawer');
var Subject_1 = require('rxjs/Subject');
var DesignRegionSvg = (function () {
    function DesignRegionSvg(svgElement) {
        var _this = this;
        this.svgElement = svgElement;
        this.elementClicked = function (element, event, onMove) {
            var handles = new handle_drawer_1["default"]([element], _this.svg, onMove);
        };
        this.bindEvents = function (set) {
            set.forEach(function (element) {
                var originalTransorm;
                var onMove = new Subject_1.Subject();
                element.drag(function (dx, dy) {
                    element.attr({
                        transform: originalTransorm + (originalTransorm ? "T" : "t") + [dx, dy]
                    });
                    onMove.next({ dx: dx, dy: dy, originalTransorm: originalTransorm });
                }, function () {
                    originalTransorm = element.transform().local;
                }, function () {
                });
                element.mousedown(function (event) { _this.elementClicked(element, event, onMove); });
            });
        };
        this.svg = Snap("#svg");
        this.bindEvents(this.svg.selectAll('[class=element]'));
        this.svg.selectAll('[class=background]').forEach(function (element) {
            element.mousedown(function (event) { console.log('background'); });
        });
        console.log(angular.element(document.querySelector('#svg')));
        //angular.element(document.querySelector('#svg')).on("mousedown", function() { console.log("click") });
    }
    return DesignRegionSvg;
}());
exports.__esModule = true;
exports["default"] = DesignRegionSvg;
},{"./handle-drawer":24,"rxjs/Subject":3}],24:[function(require,module,exports){
"use strict";
var rect_1 = require('./rect');
var HandleDrawer = (function () {
    function HandleDrawer(items, paper, onParentMove) {
        var _this = this;
        this.paper = paper;
        this.onParentMove = onParentMove;
        this.draw = function (items) {
            var bounds = _this.getBounds(items);
            var topLeft = _this.paper.rect(bounds.x - 5, bounds.y - 5, 10, 10);
            var bottomLeft = _this.paper.rect(bounds.x - 5, bounds.y + bounds.height - 5, 10, 10);
            var topRight = _this.paper.rect(bounds.x + bounds.width - 5, bounds.y - 5, 10, 10);
            var bottomRight = _this.paper.rect(bounds.x + bounds.width - 5, bounds.y + bounds.height - 5, 10, 10);
            var topMiddle = _this.paper.rect((bounds.x + (bounds.width / 2)) - 5, bounds.y - 5, 10, 10);
            var bottomMiddle = _this.paper.rect((bounds.x + (bounds.width / 2)) - 5, bounds.y + bounds.height - 5, 10, 10);
            topLeft.mousedown(function (event) { _this.handleMouseDown(event, topLeft); });
            bottomLeft.mousedown(function (event) { _this.handleMouseDown(event, bottomLeft); });
            topRight.mousedown(function (event) { _this.handleMouseDown(event, topRight); });
            bottomRight.mousedown(function (event) { _this.handleMouseDown(event, bottomRight); });
            topMiddle.mousedown(function (event) { _this.handleMouseDown(event, topMiddle); });
            bottomMiddle.mousedown(function (event) { _this.handleMouseDown(event, bottomMiddle); });
            _this.handles = _this.paper.g(topLeft, bottomLeft, topRight, bottomRight, topMiddle, bottomMiddle);
        };
        this.handleMouseDown = function (event, handle) {
        };
        this.onParentDrag = function (data) {
            _this.handles.attr({
                transform: data.originalTransorm + (data.originalTransorm ? "T" : "t") + [data.dx, data.dy]
            });
        };
        this.getBounds = function (items) {
            var minX = undefined;
            var minY = undefined;
            var maxX = undefined;
            var maxY = undefined;
            _.each(items, function (item) {
                var bbox = item.getBBox();
                if (minX === undefined || bbox.x < minX) {
                    minX = bbox.x;
                }
                if (maxX === undefined || bbox.x + bbox.width > maxX) {
                    maxX = bbox.x + bbox.width;
                }
                if (minY === undefined || bbox.y < minY) {
                    minY = bbox.y;
                }
                if (maxY === undefined || bbox.y + bbox.height > maxY) {
                    maxY = bbox.y + bbox.height;
                }
            });
            return new rect_1["default"](minX, minY, maxX - minX, maxY - minY);
        };
        this.draw(items);
        onParentMove.subscribe(this.onParentDrag);
    }
    return HandleDrawer;
}());
exports.__esModule = true;
exports["default"] = HandleDrawer;
},{"./rect":25}],25:[function(require,module,exports){
"use strict";
var Rect = (function () {
    function Rect(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    return Rect;
}());
exports.__esModule = true;
exports["default"] = Rect;
},{}]},{},[22])


//# sourceMappingURL=bundle.js.map
