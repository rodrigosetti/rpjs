'use strict';

var rp = require('../rp');

function bouncingBall(initialPos, initialVel) {
    var velocity    = rp.compose(rp.constant(-9.8),
                                 rp.integral(initialVel)),
        position    = rp.compose(velocity,
                                 rp.integral(initialPos)),
        fallingBall = rp.fanout(function (v, p) { return { vel: v, pos: p}; },
                                velocity,
                                position);

    return rp.dSwitch(fallingBall,
                      function (ball) { return ball.pos <= 0; },
                      function (ball) {
                         return bouncingBall(0, -0.9 * ball.vel);
                      });
}

rp.react(rp.compose(bouncingBall(10.0, 0),
                    rp.lift(function (ball) { console.log([ball.vel, ball.pos].join(',')); }),
                    rp.time(),
                    rp.lift(function (t) { return t < 10; })));

