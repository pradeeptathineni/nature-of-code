import React, { useRef, useEffect } from "react";
import p5, { PI } from "p5";
import Tile from "./Tile";

export const DIMENSION = 2; // set this to 1 to operate on one tile as base case
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
                for (let i = 0; i < DIMENSION ** 2; i++) {
                    tiles.push(new Tile(i));
                }
            };

            p.draw = () => {
                p.clear();
                for (let i = 0; i < tiles.length; i++) {
                    let tile = tiles[i];
                    tile.showOutline(p);
                    tile.showPattern(p);
                    for (let port of tile.ports) {
                        port.display(p);
                        // port.display(p, false); // use this line instead to omit port labels
                    }
                }
            };

            p.mouseClicked = () => {
                console.log("clicking should rotate each tile 90 degrees");
                for (let i = 0; i < tiles.length; i++) {
                    let tile = tiles[i];
                    let o = tile.addToOrientation(90); // add 90 degrees to tile's orientation should rotate tile, ports, outline, labels, etc?
                    // for (let port of tile.ports) {
                    //     port.rotatePort(p);
                    // }
                    console.log(`tile ${i} orientation = ${o}`);
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
