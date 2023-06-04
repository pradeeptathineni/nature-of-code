import React, { useRef, useEffect } from "react";
import p5 from "p5";
import Tile from "./Tile";

export const WIDTH = window.innerHeight;
export const HEIGHT = window.innerHeight;

export const DIMENSION = 3;

export const TILE_WIDTH = WIDTH / DIMENSION;
export const TILE_HEIGHT = HEIGHT / DIMENSION;

const NUM_TILE_PORTS = 3;
export const TILE_PORTS = NUM_TILE_PORTS + 1;

export const PORT_WIDTH = TILE_WIDTH / TILE_PORTS;
export const PORT_HEIGHT = TILE_HEIGHT / TILE_PORTS;
export const PORT_ACTIVE_CHANCE = 0.6;

const REDUCE_OPTIONS_FACTOR = 4;
export const NUM_POSSIBLE_OPTIONS = Math.ceil(
    DIMENSION ** 2 / REDUCE_OPTIONS_FACTOR
);

const INCLUDE_EMPTY_TILE = false;
const INCLUDE_FULL_TILE = false;

let TOGGLE = 0;

export default function WaveFunctionCollapse() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const sketch = new p5((p) => {
            let referenceTiles = [];
            let collapsingTiles = [];

            p.setup = () => {
                p.createCanvas(WIDTH, HEIGHT);
                p.angleMode(p.DEGREES);
                p.rectMode(p.CENTER);
                // p.noLoop();
                p.frameRate(1);
                p.push();
                if (DIMENSION === 1) {
                    let tile = new Tile(p, 0, true);
                    referenceTiles.push(tile);
                } else {
                    for (let i = 0; i < NUM_POSSIBLE_OPTIONS; i++) {
                        let shouldBeEmpty = false,
                            shouldBeFull = false;
                        if (INCLUDE_EMPTY_TILE && INCLUDE_FULL_TILE) {
                            if (i === 0) shouldBeEmpty = true;
                            if (i === 1) shouldBeFull = true;
                        } else if (!INCLUDE_EMPTY_TILE && INCLUDE_FULL_TILE) {
                            if (i === 0) shouldBeFull = true;
                        }
                        let tile = new Tile(
                            p,
                            i,
                            true,
                            shouldBeEmpty,
                            shouldBeFull
                        );
                        referenceTiles.push(tile);
                        // console.log(tile);
                    }
                }
                p.pop();
                p.push();
                for (let i = 0; i < DIMENSION ** 2; i++) {
                    let tile = new Tile(p, i, false, true, false);
                    collapsingTiles.push(tile);
                }
                p.pop();
                console.log("referenceTiles", referenceTiles);
                console.log("collapsingTiles", collapsingTiles);
                collapse(true);
            };

            p.draw = () => {
                p.clear();
                let drawTheseTiles =
                    TOGGLE === 0 ? collapsingTiles : referenceTiles;
                for (let i = 0; i < drawTheseTiles.length; i++) {
                    // collapse();
                    let tile = drawTheseTiles[i];
                    tile.draw(p);
                }
            };

            p.mouseClicked = () => {
                TOGGLE++;
                if (TOGGLE >= 2) TOGGLE = 0;
            };

            function collapse(randomly = false) {
                let referenceChoiceOffset =
                    INCLUDE_EMPTY_TILE * 1 + INCLUDE_FULL_TILE * 1;
                let leastOptions = Number.NEGATIVE_INFINITY;
                let referenceIndex, collapsingIndex;

                if (randomly) {
                    if (DIMENSION === 1) {
                        referenceIndex = 0;
                    } else if (DIMENSION === 2) {
                        referenceIndex = referenceChoiceOffset;
                    }
                    referenceIndex =
                        DIMENSION > 1
                            ? Math.floor(
                                  Math.random() *
                                      (referenceTiles.length -
                                          referenceChoiceOffset)
                              ) + referenceChoiceOffset
                            : 0;
                } else {
                    referenceIndex = Math.floor(
                        Math.random() * referenceTiles.length
                    );
                }

                let equalLeastOptions = [];
                if (randomly) {
                    equalLeastOptions.push(
                        Math.floor(Math.random() * collapsingTiles.length)
                    );
                } else {
                    for (let i = 0; i < collapsingTiles.length; i++) {
                        console.log("Before:", equalLeastOptions);
                        let tile = collapsingTiles[i];
                        let numOptions = tile.options.length;
                        if (numOptions <= leastOptions) {
                            if (numOptions < leastOptions) {
                                equalLeastOptions = [];
                                leastOptions = numOptions;
                            }
                            equalLeastOptions.push(i);
                        }
                        console.log("After:", equalLeastOptions);
                    }
                }
                console.log("equalLeastOptions", equalLeastOptions);
                if (equalLeastOptions.length > 1) {
                    collapsingIndex =
                        equalLeastOptions[
                            Math.floor(
                                Math.random() * (equalLeastOptions.length - 1)
                            )
                        ];
                } else {
                    collapsingIndex = equalLeastOptions[0];
                }
                const referenceTile = referenceTiles[referenceIndex];
                console.log("referenceTile", referenceTile);
                if (randomly) {
                    console.log(
                        "Before collapsingTile:",
                        collapsingTiles[collapsingIndex]
                    );
                    collapsingTiles[collapsingIndex] = new Tile(
                        p,
                        collapsingIndex
                    );
                    collapsingTiles[collapsingIndex].TOP = referenceTile.TOP;
                    collapsingTiles[collapsingIndex].RIGHT =
                        referenceTile.RIGHT;
                    collapsingTiles[collapsingIndex].BOTTOM =
                        referenceTile.BOTTOM;
                    collapsingTiles[collapsingIndex].LEFT = referenceTile.LEFT;
                    collapsingTiles[collapsingIndex].ports.map((port) => {
                        const referencePorts = referenceTile.ports;
                        let referencePort;
                        for (let idx in referencePorts) {
                            const refPort = referencePorts[idx];
                            if (refPort.index === port.index) {
                                referencePort = refPort;
                            }
                        }
                        // console.log("ref port:", referencePort);
                        // console.log("coll port:", port);
                        port.active = referencePort.active;
                        // port.row = port.index % DIMENSION;
                        // port.col = Math.floor(port.index / DIMENSION);
                        // port.x = port.row * TILE_WIDTH;
                        // port.y = port.col * TILE_HEIGHT;
                        // port.tile = collapsingTiles[collapsingIndex];
                        return port;
                    });
                    collapsingTiles[collapsingIndex].rotation += 90;

                    console.log(
                        "After collapsingTile:",
                        collapsingTiles[collapsingIndex]
                    );
                }
            }

            function removeDuplicateTiles(tiles) {
                return tiles.filter(
                    (tile, index, self) =>
                        index ===
                        self.findIndex(
                            (t) =>
                                t.TOP === tile.TOP &&
                                t.RIGHT === tile.RIGHT &&
                                t.BOTTOM === tile.BOTTOM &&
                                t.LEFT === tile.LEFT
                        )
                );
            }
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
