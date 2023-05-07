import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function PerlinTerrain() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cols, rows;
    let scl = 50;
    let w = 1000;
    let h = 1000;
    let flying = 0;
    let terrain = [];

    useEffect(() => {
        const sketch = new p5((p) => {
            p.setup = () => {
                p.createCanvas(width, height, p.WEBGL);
                cols = w / scl;
                rows = h / scl;

                for (let x = 0; x < cols; x++) {
                    terrain[x] = [];
                    for (let y = 0; y < rows; y++) {
                        terrain[x][y] = 0; //specify a default value for now
                    }
                }
            };

            p.draw = () => {
                p.directionalLight(255, 255, 0, 0, 100, -200);
                flying -= 0.01;
                let yoff = flying;
                for (let y = 0; y < rows; y++) {
                    let xoff = 0;
                    for (let x = 0; x < cols; x++) {
                        terrain[x][y] = p.map(
                            p.noise(xoff, yoff),
                            0,
                            1,
                            -100,
                            100
                        );
                        xoff += 0.2;
                    }
                    yoff += 0.2;
                }

                p.background(0);
                p.translate(0, 50);
                p.rotateX(p.PI / 3);
                p.fill(255, 255, 255, 50);
                p.translate(-w / 2, -h / 2);
                for (var y = 0; y < rows - 1; y++) {
                    p.beginShape(p.TRIANGLE_STRIP);
                    for (var x = 0; x < cols; x++) {
                        // p.noStroke();
                        p.vertex(x * scl, y * scl, terrain[x][y]);
                        p.vertex(x * scl, (y + 1) * scl, terrain[x][y + 1]);
                    }
                    p.endShape();
                }
            };

            p.mouseMoved = () => {};
        }, canvasRef.current);

        return sketch.remove;
    }, []);

    function handleKeyPress(e) {
        if (e.key === "w") {
        }
    }

    return <div ref={canvasRef} tabIndex="0" onKeyPress={handleKeyPress} />;
}

const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
