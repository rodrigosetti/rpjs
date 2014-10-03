'use strict';

var _ = require('lodash');

/**
 *  Reactive Programming in Javascript
 *
 * - Signal: some value that varies in time (t -> s)
 * - Signal function : transforms a signal into another
 */
var rp = module.exports = {
    /**
     * The constant signal function
     */
    constant : _.constant,

    /**
     * Numerical integration of the signal value with integration constant c.
     *
     * Works with scalar and vector values.
     */
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
     * Outputs the current time.
     */
    time : function () {
        return rp.compose(rp.constant(1), rp.integral());
    },

    /**
     * The limit when times goes to infinity for the feedback of a signal
     * function "sf", is the fixed point of "sf.
     *
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

    /**
     * Lift a pure function to a signal function
     */
    lift : function (f) {
        return function (dt, value) {
            return f(value);
        };
    },

    /**
     * dSwitch (delayed switch)
     *
     * Change the underlying signal function once the predicate is true, the
     * second signal function is constructed by the third parameter by the
     * current value.
     *
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

    /**
     * React
     * 
     * Uses the Euler Method to perform numerical integrations of the Ordinary
     * Differential Equation encoded as the first parameter signal function.
     *
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

