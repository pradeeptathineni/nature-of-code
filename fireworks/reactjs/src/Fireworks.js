import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function Fireworks() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let widthRatio = width * 0.01;
    let fireworkSpeed = widthRatio * 1.5;
    let trailSpeed = widthRatio;
    let maxTrails = 100;
    let trailColorShift = 30;
    let trailWiggle = 0.05;
    let trailExplodeSpeed = 0.9;
    let lifespanLossSpeed = 1.5;
    let newFireworkChance = 0.02;
    let gravity = 0.2;
    let maxGravity = gravity * 2;
    let windFactor = 0.04;

    useEffect(() => {
        var fireworks = [];

        const sketch = new p5((p) => {
            p.setup = () => {
                p.createCanvas(width, height).parent(canvasRef.current);
                p.angleMode(p.DEGREES);
                // p.translate(width / 2, height / 2);
                p.colorMode(p.HSB);
                gravity = p.createVector(0, 0.2);
                p.stroke(255);
                p.strokeWeight(4);
                p.background(0);
            };

            p.draw = () => {
                p.colorMode(p.RGB);
                p.background(0, 0, 0, 25);

                if (p.random(1) < newFireworkChance) {
                    fireworks.push(new Firework());
                }

                for (var i = fireworks.length - 1; i >= 0; i--) {
                    fireworks[i].update();
                    fireworks[i].show();

                    if (fireworks[i].done()) {
                        fireworks.splice(i, 1);
                    }
                }
            };

            p.mouseMoved = () => {};

            function Firework() {
                this.hue = p.random(255);
                this.firework = new Particle(
                    p.random(width),
                    height,
                    this.hue,
                    true
                );
                this.exploded = false;
                this.particles = [];
                // gravity = p.createVector(0, p.random(0, maxGravity));

                this.done = function () {
                    if (this.exploded && this.particles.length === 0) {
                        return true;
                    } else {
                        return false;
                    }
                };

                this.update = function () {
                    let wind = p.createVector(p.random(windFactor), 0);
                    if (!this.exploded) {
                        this.firework.applyForce(gravity);
                        this.firework.applyForce(wind);
                        this.firework.update();

                        if (this.firework.vel.y >= 0) {
                            this.exploded = true;
                            this.explode();
                        }
                    }

                    for (var i = this.particles.length - 1; i >= 0; i--) {
                        this.particles[i].applyForce(
                            p.random() > 0.5
                                ? p.createVector(
                                      p.random(-trailWiggle, trailWiggle),
                                      p.random(
                                          maxGravity * 0.01,
                                          maxGravity * 0.02
                                      )
                                  )
                                : p.createVector(
                                      p.random(-trailWiggle, trailWiggle),
                                      p.random(maxGravity * 0.9, maxGravity)
                                  )
                        );
                        this.particles[i].applyForce(wind);
                        this.particles[i].update();

                        if (this.particles[i].done()) {
                            this.particles.splice(i, 1);
                        }
                    }
                };

                this.explode = function () {
                    for (
                        var i = 0;
                        i < p.random(maxTrails / 4, maxTrails);
                        i++
                    ) {
                        var particle = new Particle(
                            this.firework.pos.x,
                            this.firework.pos.y,
                            p.random(
                                this.hue - trailColorShift,
                                this.hue + trailColorShift
                            ),
                            false
                        );
                        this.particles.push(particle);
                    }
                };

                this.show = function () {
                    if (!this.exploded) {
                        this.firework.show();
                    }

                    for (var i = 0; i < this.particles.length; i++) {
                        this.particles[i].show();
                    }
                };
            }

            function Particle(x, y, hue, firework) {
                this.hue = hue;
                this.firework = firework;
                this.pos = p.createVector(x, y);
                this.acc = p.createVector(0, 0);
                this.lifespan = 255;

                if (this.firework) {
                    this.vel = p.createVector(
                        0,
                        p.random(-fireworkSpeed, -fireworkSpeed * 0.8)
                    );
                } else {
                    this.vel = p5.Vector.random2D();
                    this.vel.mult(p.random(trailSpeed, trailSpeed * 2));
                }

                this.applyForce = function (force) {
                    this.acc.add(force);
                };

                this.update = function () {
                    if (!this.firework) {
                        this.vel.mult(trailExplodeSpeed);
                        this.lifespan -= lifespanLossSpeed;
                    }

                    this.vel.add(this.acc);
                    this.pos.add(this.vel);
                    this.acc.mult(0);
                };

                this.done = function () {
                    if (this.lifespan < 0) {
                        return true;
                    } else {
                        return false;
                    }
                };

                this.show = function () {
                    p.colorMode(p.HSB);

                    if (!this.firework) {
                        p.strokeWeight(p.random(1, 3));
                        p.stroke(hue, 255, 255, this.lifespan);
                    } else {
                        p.strokeWeight(p.random(4, 6));
                        p.stroke(hue, 255, 255);
                    }

                    p.point(this.pos.x, this.pos.y);
                };
            }
        }, canvasRef.current);

        return sketch.remove;
    }, []);

    function handleKeyPress(e) {
        if (e.key === "w") {
        }
    }

    return <div ref={canvasRef} tabIndex="0" onKeyPress={handleKeyPress} />;
}
