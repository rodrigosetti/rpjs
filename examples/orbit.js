'use strict';

var frp = require('../frp'),
    _   = require('lodash');


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
  return frp.feedback(initialPos,
                      frp.compose(frp.lift(force),            // position -> acceleration
                                  frp.integral(initialVel),   //          -> velocity
                                  frp.integral(initialPos))); //          -> position
}

frp.react(frp.compose(orbit([60, 60], [1, -0.1]),
                      frp.lift(function (v) { console.log(v.join(',')); }),
                      frp.time(),
                      frp.lift(function (t) { return t < 700; })));

