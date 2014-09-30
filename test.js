'use strict';

var _   = require('lodash'),
    frp = require('./frp');

function makeBouncingBall(initialPos, initialVel) {
    var velocity    = frp.compose(frp.constant(-9.8),
                                  frp.integral(initialVel)),
        position    = frp.compose(velocity,
                                  frp.integral(initialPos)),
        fallingBall = frp.fanout(function (v, p) { return { vel: v, pos: p}; },
                                 velocity,
                                 position);

    return frp.dSwitch(fallingBall,
                       function (ball) { return ball.pos <= 0; },
                       function (ball) {
                          return makeBouncingBall(0, -0.9 * ball.vel);
                       });
}

var i=0;
frp.react(makeBouncingBall(10.0, 0),
          _.constant({ dt: 0.1 }),
          function (r) {
            console.log([r.vel, r.pos].join(','));
            return i++ < 100;
        });

