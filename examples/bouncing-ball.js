'use strict';

var frp = require('../frp');

function bouncingBall(initialPos, initialVel) {
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
                          return bouncingBall(0, -0.9 * ball.vel);
                       });
}

frp.react(frp.compose(bouncingBall(10.0, 0),
                      frp.lift(function (ball) { console.log([ball.vel, ball.pos].join(',')); }),
                      frp.time(),
                      frp.lift(function (t) { return t < 10; })));

