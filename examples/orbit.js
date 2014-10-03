'use strict';

var rp = require('../rp'),
    _  = require('lodash');

// "fake" gravitational constant
var G = 100;

// calculate the "instantaneous" force vector of our planet object given it's
// position vector
function force(p) {
    var d = Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
    return [ G * -p[0] / Math.pow(d, 3),
             G * -p[1] / Math.pow(d, 3) ];
}

// The orbit system is a feedback loop:
//
//              position - force -> acceleration
//                 ^                     |
//                 |                     |
//              integral              integral
//                 |                     |
//                 +----- velocity <-----+
//
function orbit(initialPos, initialVel) {
  return rp.feedback(initialPos,
                     rp.compose(rp.lift(force),            // position -> acceleration
                                rp.integral(initialVel),   //          -> velocity
                                rp.integral(initialPos))); //          -> position
}

rp.react(rp.compose(rp.fanout(function (t, p) { console.log(t + ',' + p.join(',')); return t; },
                              rp.time(),
                              orbit([60, 60], [1, -0.1])),
                    rp.lift(function (t) { return t < 2000; })));

