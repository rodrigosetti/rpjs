'use strict';

var _ = require('lodash');

/*
# Functional Reactive Programming in Javascript

## Concepts

 * Signal: some value that varies in time (t -> s)
 * Signal function : transforms a signal into another

*/

var frp = module.exports = {
    // ### Sources

    constant : _.constant,

    time : function () {
        return frp.compose(frp.constant(1), frp.integral());
    },

    // ### Combinators

    integral : function (c) {
        var accum = c || 0;
        return function(dt, value) {
            if (_.isArray(value)) {
                accum = _.map(value,
                              function(v, i) { return (accum[i] || 0) + (dt * v); });
            } else {
                accum += dt * value;
            }
            return accum;
        };
    },

    /**
     *     initialValue --- sf ---+---> y
     *                      ^     |
     *                      |     |
     *                      +-----+
     */
    feedback : function (initValue, sf) {
        return function (dt) {
            initValue = sf(dt, initValue);
            return initValue;
        };
    },

    /**
     * send input value to all signal function arguments and through f
     *
     *     x ---------> +---+
     *     y ---------> | f | ------> w
     *     z ---------> +---+
     *
     */
    fanout : function () {
        var f   = _.first(arguments),
            sfs = _.rest(arguments);
        return function (dt, value) {
            return f.apply(f, _.map(sfs, function (sf) { return sf(dt, value); }));
        };
    },

    /**
     * Composition of signal functions
     *
     * x ---> y  +  y ---> z = x ---> z
     *
     */
    compose : function () {
        var sfs = arguments;
        return function(dt, value) {
            _.forEach(sfs, function (sf) { value = sf(dt, value); });
            return value;
        };
    },

    // ### Combinators to work with pure functions

    lift : function (f) {
        return function (dt, value) {
            return f(value);
        };
    },

    // ### Switches

    /**
     *                      / +------ sf --+
     *       +------------+                |--> y
     *       |                +------ sf' -+
     *   x >-|              ^          ^
     *       |              |          |
     *       +- predicate? -+- makeSF -+
     */
    dSwitch : function (sf, predicate, makeSF) {
        var switchedSF;
        return function (dt, value) {
            if (switchedSF) {
                return switchedSF(dt, value);
            } else {
                value = sf(dt, value);
                if (predicate(value)) {
                    switchedSF = makeSF(value);
                }
                return value;
            }
        };
    },

    // ### React

    /**
     * @param sf - signal function from *any* to true|false (continue or stop)
     * @param input (optional) - (function|array) of { dt: double, value: any }
     */
    react : function (sf, input) {
        input = input || _.constant({ dt: 0.1 });
        if (_.isFunction(input)) {
            var cont = true;
            while (cont) {
                var step = input();
                cont = sf(step.dt, step.value);
            }
        } else if (_.isArray(input)) {
            _.forEach(input, function (step) {
                return sf(step.dt, step.value);
            });
        }
    }

};

