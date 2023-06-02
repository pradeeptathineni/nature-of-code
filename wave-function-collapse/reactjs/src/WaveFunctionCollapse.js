import React, { useRef, useEffect } from "react";
import p5 from "p5";
import Tile from "./Tile";

export const DIMENSION = 3; // set this to 1 to operate on one tile as base case
export const WIDTH = window.innerHeight;
export const HEIGHT = window.innerHeight;
export const TILE_WIDTH = Math.ceil(WIDTH / DIMENSION);
export const TILE_HEIGHT = Math.ceil(HEIGHT / DIMENSION);
export const TILE_PORTS = 3;
export const PORT_WIDTH = TILE_WIDTH / TILE_PORTS;
export const PORT_HEIGHT = TILE_HEIGHT / TILE_PORTS;

export default function WaveFunctionCollapse() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const sketch = new p5((p) => {
            let tiles = [];

            p.setup = () => {
                p.createCanvas(WIDTH, HEIGHT);
                p.angleMode(p.DEGREES);
                p.rectMode(p.CENTER);
                // p.frameRate(1);
                for (let i = 0; i < DIMENSION ** 2; i++) {
                    tiles.push(new Tile(p, i));
                }
            };

            p.draw = () => {
                // p.clear();
                for (let i = 0; i < tiles.length; i++) {
                    p.push();
                    let tile = tiles[i];
                    tile.draw(p);
                }
            };

            p.mouseClicked = () => {
                for (let i = 0; i < tiles.length; i++) {
                    let tile = tiles[i];
                    let o = tile.addToOrientation(90);
                    // console.log(`tile ${i} orientation = ${o}`);
                }
            };
        }, canvasRef.current);

        return sketch.remove;
    }, []);

    function handleKeyPress(e) {}

    return <div ref={canvasRef} tabIndex="0" onKeyPress={handleKeyPress} />;
}

// function drawGrid(p) {
//     for (let y = 0; y < HEIGHT; y += TILE_HEIGHT) {
//         for (let x = 0; x < WIDTH; x += TILE_WIDTH) {
//             let rowNum = (x + 1) * DIMENSION;
//             let colNum = (y + 1) * DIMENSION;
//             p.push();
//             p.translate(TILE_WIDTH / 2, TILE_HEIGHT / 2);
//             p.stroke(1);
//             p.rect(x, y, TILE_WIDTH, TILE_HEIGHT);
//             p.pop();
//         }
//     }
// }
