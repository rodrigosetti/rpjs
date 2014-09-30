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
            accum += dt * value;
            return accum;
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
     * @param sf - signal function
     * @param input - (function|array) of { dt: double, value: any }
     * @param output - function (result), return true|false if continue or stop
     */
    react : function (sf, input, output) {
        if (_.isFunction(input)) {
            var cont = true;
            while (cont) {
                var step = input();
                cont = output(sf(step.dt, step.value));
            }
        } else if (_.isArray(input)) {
            _.forEach(input, function (step) {
                return output(sf(step.dt, step.value));
            });
        }
    }

};

