import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function Starfield() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let spreadFactor = 3;
    let depthFactor = 10;
    let twinkleFactor = 1.5;
    let maxDepth = width * depthFactor;
    let speed = 20;
    let cruiseSpeed = 20;
    let numStars = 1000;
    let starSize = 10;
    let zOffset = width;

    useEffect(() => {
        let stars = [];

        const sketch = new p5((p) => {
            p.setup = () => {
                p.createCanvas(width, height);
                p.colorMode(p.HSB, 360, 100, 100, 100);
                p.rectMode(p.CENTER);
                for (let i = 0; i < numStars; i++) {
                    stars[i] = new Star(p);
                }
            };

            p.draw = () => {
                p.background(0);
                p.translate(width / 2, height / 2);
                for (let i = 0; i < stars.length; i++) {
                    let star = stars[i];
                    star.update();
                    star.show();
                }

                if (p.keyIsPressed) {
                    if (p.key === "w") {
                        speed += 10;
                    } else if (p.key === "s") {
                        speed -= 10;
                    } else if (p.key === "x") {
                        speed = cruiseSpeed;
                    }
                }
            };

            p.mouseMoved = () => {};
        }, canvasRef.current);
        return sketch.remove;
    }, []);

    function Star(p) {
        this.id = uid();
        this.z = p.random(0, maxDepth * spreadFactor) + zOffset;
        let s = p.map(this.z, maxDepth, 0, spreadFactor, 1);
        let w = width * s;
        let h = height * s;
        this.x = p.random(-w, w);
        this.y = p.random(-h, h);
        this.pz = this.z;
        this.color = [p.random(360), p.random(0, 25), p.random(80, 100)];
        this.r = 0;

        this.update = function () {
            this.z = this.z - speed;
            if (this.z < 1) {
                this.z = p.random(maxDepth * 0.8, maxDepth);
                let s = p.map(this.z, maxDepth, 0, spreadFactor, 1);
                let w = width * s;
                let h = height * s;
                this.x = p.random(-w, w);
                this.y = p.random(-h, h);
                this.pz = this.z;
            }
        };

        this.show = function () {
            let sx = p.map(this.x / this.z, 0, 1, 0, w);
            let sy = p.map(this.y / this.z, 0, 1, 0, h);

            let r = this.r || p.map(this.z, 0, maxDepth, starSize, 0);
            let opacity = p.map(this.z, 500, maxDepth, 100, 0);
            opacity += p.random(-twinkleFactor, twinkleFactor);

            p.noStroke();
            p.fill(...this.color, opacity);
            p.ellipse(sx, sy, r, r);

            let px = p.map(this.x / this.pz, 0, 1, 0, w);
            let py = p.map(this.y / this.pz, 0, 1, 0, h);

            this.pz = this.z;

            p.strokeWeight(starSize / 4);
            p.stroke(...this.color, opacity);
            p.line(px, py, sx, sy);
        };
    }

    return <div ref={canvasRef} />;
}

const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
