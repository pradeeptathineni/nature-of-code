import React, { useRef, useEffect } from "react";
import p5 from "p5";
import Tile from "./Tile";

export const WIDTH = window.innerHeight;
export const HEIGHT = window.innerHeight;

export const DIMENSION = 2;

export const TILE_WIDTH = WIDTH / DIMENSION;
export const TILE_HEIGHT = HEIGHT / DIMENSION;

const NUM_TILE_PORTS = 3;
export const TILE_PORTS = NUM_TILE_PORTS + 1;

export const PORT_WIDTH = TILE_WIDTH / TILE_PORTS;
export const PORT_HEIGHT = TILE_HEIGHT / TILE_PORTS;
export const PORT_ACTIVE_CHANCE = 0.5;

const REDUCE_OPTIONS_FACTOR = 1;
export const NUM_POSSIBLE_OPTIONS = Math.ceil(
    DIMENSION ** 2 / REDUCE_OPTIONS_FACTOR
);

const INCLUDE_EMPTY_TILE = false;
const INCLUDE_FULL_TILE = true;

let TOGGLE = 0;
let LOOP_COUNT = 0;

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
                // p.frameRate(7);
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
                    }
                }
                // console.log("Before removing dupe refs", referenceTiles);
                referenceTiles = removeDuplicateTiles(referenceTiles);
                for (let i = 0; i < DIMENSION ** 2; i++) {
                    let tile = new Tile(p, i, false, true, false);
                    collapsingTiles.push(tile);
                }
                // console.log("After removing dupe refs", referenceTiles);
                updateOptions(true);
            };

            p.draw = () => {
                // console.log(`  [START] \tloop ${LOOP_COUNT}`);
                p.clear();
                collapse(LOOP_COUNT === 0);
                updateOptions();
                let drawTheseTiles =
                    TOGGLE === 0 ? collapsingTiles : referenceTiles;
                for (let i = 0; i < drawTheseTiles.length; i++) {
                    let tile = drawTheseTiles[i];
                    if (tile !== null) tile.draw(p, true, true, false);
                }
                // console.log(`  [END] \tloop ${LOOP_COUNT}`);
                LOOP_COUNT++;
                p.noLoop();
            };

            p.mouseClicked = () => {
                if (p.mouseX <= TILE_WIDTH && p.mouseY <= TILE_HEIGHT) {
                    TOGGLE++;
                    if (TOGGLE >= 2) TOGGLE = 0;
                    console.log(TOGGLE);
                    // console.log(
                    //     TOGGLE
                    //         ? "reference tiles will be shown next frame"
                    //         : "collapsing tiles will be shown next frame"
                    // );
                } else {
                    p.loop();
                }
            };

            function updateOptions(init = false) {
                assertType(init, "boolean");
                if (init) {
                    let options = {};
                    for (let i = 0; i < referenceTiles.length; i++) {
                        const referenceTile = referenceTiles[i];
                        const refSigs = arrayCycles(referenceTile.signature);
                        for (const sig of refSigs) {
                            options[sig.join("")] = i;
                        }
                    }
                    for (let i = 0; i < collapsingTiles.length; i++) {
                        const collapsingTile = collapsingTiles[i];
                        collapsingTile.options = options;
                    }
                } else {
                    for (let i = 0; i < collapsingTiles.length; i++) {
                        let c = collapsingTiles[i];

                        if (c.collapsed) continue;

                        let topTile = collapsingTiles[c.TILE_TOP];
                        let rightTile = collapsingTiles[c.TILE_RIGHT];
                        let bottomTile = collapsingTiles[c.TILE_BOTTOM];
                        let leftTile = collapsingTiles[c.TILE_LEFT];

                        const tileTopBottomPorts = topTile?.collapsed
                            ? topTile?.VSIDE_BOTTOM
                            : null;
                        const tileRightLeftPorts = rightTile?.collapsed
                            ? rightTile?.VSIDE_LEFT
                            : null;
                        const tileBottomTopPorts = bottomTile?.collapsed
                            ? bottomTile?.VSIDE_TOP
                            : null;
                        const tileLeftRightPorts = leftTile?.collapsed
                            ? leftTile?.VSIDE_RIGHT
                            : null;

                        if (
                            tileTopBottomPorts === null &&
                            tileRightLeftPorts === null &&
                            tileBottomTopPorts === null &&
                            tileLeftRightPorts === null
                        )
                            continue;

                        const placeholder = "?".repeat(NUM_TILE_PORTS);
                        const signatureNeeded = [
                            tileTopBottomPorts !== null
                                ? tileTopBottomPorts
                                : placeholder,
                            tileRightLeftPorts !== null
                                ? tileRightLeftPorts
                                : placeholder,
                            tileBottomTopPorts !== null
                                ? tileBottomTopPorts
                                : placeholder,
                            tileLeftRightPorts !== null
                                ? tileLeftRightPorts
                                : placeholder,
                        ];
                        let possibleSignatures = generateBinaries(
                            signatureNeeded.join("")
                        );
                        console.log("signatureNeeded", signatureNeeded);
                        let chosenSignature =
                            possibleSignatures[
                                Math.floor(
                                    Math.random() * possibleSignatures.length
                                )
                            ];
                        c.randomBackupCreateSignature = chosenSignature;
                        console.log(
                            "randomBackupCreateSignature",
                            chosenSignature
                        );

                        // console.log("possibleSignatures", possibleSignatures);

                        // console.log(
                        //     tileTopBottomPorts,
                        //     tileRightLeftPorts,
                        //     tileBottomTopPorts,
                        //     tileLeftRightPorts
                        // );

                        // console.log(
                        //     "Before updateOptions:",
                        //     i,
                        //     Object.keys(c.options).length,
                        //     JSON.stringify(c.options, undefined, 4)
                        // );
                        let options = {};
                        for (let i = 0; i < referenceTiles.length; i++) {
                            const refRotationSigs =
                                referenceTiles[i].rotationSignatures;
                            // console.log(refRotationSigs);
                            for (const option of possibleSignatures) {
                                // console.log(option, option in refRotationSigs);
                                if (option in refRotationSigs) {
                                    options[option] = i;
                                }
                            }
                        }
                        c.options = options;

                        // console.log(
                        //     "After update options:",
                        //     i,
                        //     Object.keys(c.options).length,
                        //     JSON.stringify(c.options, undefined, 4)
                        // );
                    }
                }
            }

            function collapse(init = false) {
                assertType(init, "boolean");
                let referenceChoiceOffset =
                    INCLUDE_EMPTY_TILE * 1 + INCLUDE_FULL_TILE * 1;
                let referenceIdx,
                    collapsingIdx,
                    rotation = 0,
                    createNewTile = false;

                // Find the tile indices with the lowest options
                let leastOptions = Number.POSITIVE_INFINITY;
                let equalLeastOptions = [];
                if (init) {
                    // Pick the index of any collapsing tile randomly to be the tile with lowest options
                    equalLeastOptions.push(
                        Math.floor(Math.random() * collapsingTiles.length)
                    );
                } else {
                    for (let i = 0; i < collapsingTiles.length; i++) {
                        let tile = collapsingTiles[i];
                        if (tile.collapsed) continue;
                        let numOptions = Object.keys(tile.options).length;
                        if (numOptions <= leastOptions) {
                            if (numOptions < leastOptions) {
                                equalLeastOptions = [];
                                leastOptions = numOptions;
                            }
                            equalLeastOptions.push(i);
                        }
                    }
                }

                // Choose an index of a least options collapsing tile randomly
                collapsingIdx =
                    equalLeastOptions[
                        Math.floor(Math.random() * equalLeastOptions.length)
                    ];

                if (collapsingIdx === undefined) return;

                console.log("collapsingIdx", collapsingIdx);

                // Get the index of a random or specific reference tile
                if (init) {
                    if (DIMENSION === 1) {
                        referenceIdx = 0;
                    } else if (DIMENSION === 2) {
                        referenceIdx = referenceChoiceOffset;
                    }
                    referenceIdx =
                        DIMENSION > 1
                            ? Math.floor(
                                  Math.random() *
                                      (referenceTiles.length -
                                          referenceChoiceOffset)
                              ) + referenceChoiceOffset
                            : 0;
                } else {
                    let finalOptions = [];
                    const options = collapsingTiles[collapsingIdx].options;
                    for (let i = 0; i < referenceTiles.length; i++) {
                        const refRotationSigs =
                            referenceTiles[i].rotationSignatures;
                        for (const option in options) {
                            if (option in refRotationSigs) {
                                let index = options[option];
                                let rotation = refRotationSigs[option];
                                finalOptions.push([index, rotation]);
                            }
                        }
                    }

                    if (finalOptions.length === 0) {
                        createNewTile = true;
                    } else {
                        let finalChoice =
                            finalOptions[
                                Math.floor(Math.random() * finalOptions.length)
                            ];
                        referenceIdx = finalChoice[0];
                        rotation = finalChoice[1];
                    }

                    // console.log(referenceIdx, rotation);
                }

                const referenceTile = referenceTiles[referenceIdx];
                // console.log("referenceTile", referenceTile);
                // console.log(
                //     "Before collapsing tile:",
                //     collapsingTiles[collapsingIdx]
                // );
                const createSignature =
                    collapsingTiles[collapsingIdx].randomBackupCreateSignature;
                collapsingTiles[collapsingIdx] = new Tile(p, collapsingIdx);
                if (createNewTile) {
                    collapsingTiles[collapsingIdx].setTileState(
                        createSignature,
                        rotation,
                        true,
                        false,
                        true
                    );
                } else {
                    collapsingTiles[collapsingIdx].setTileState(
                        referenceTile.ports,
                        0,
                        true
                    );
                }
                // console.log(
                //     "After collapsing tile:",
                //     collapsingTiles[collapsingIdx]
                // );
            }

            // Maintains the position of each tile within its array, but replaces it with null if it is a duplicate
            function removeDuplicateTiles(tiles, maintainPosition) {
                if (maintainPosition) {
                    for (let i = 0; i < tiles.length; i++) {
                        const tile = tiles[i];
                        if (tile === null) continue;
                        const duplicateIdx = tiles.findIndex((t, idx) => {
                            if (t !== null) {
                                let referenceTileSigs = t.signatures;
                                let thisTileSigs = tile.signatures;
                                for (const refRotation in referenceTileSigs) {
                                    for (const thisRotation in thisTileSigs) {
                                        if (
                                            i !== idx &&
                                            referenceTileSigs[refRotation] ==
                                                thisTileSigs[thisRotation]
                                        ) {
                                            return true;
                                        }
                                    }
                                }
                            }
                        });
                        if (duplicateIdx > -1) tiles[duplicateIdx] = null;
                    }
                    return tiles;
                } else {
                    return tiles.filter(
                        (tile, index, self) =>
                            index ===
                            self.findIndex((t) => {
                                let tileSignature = tile.signature;
                                let tileSignatures = arrayCycles(tileSignature);
                                // console.log(
                                //     index,
                                //     tile.signature,
                                //     tileSignatures
                                // );
                                for (const tileSig of tileSignatures) {
                                    if (
                                        JSON.stringify(tileSig) ===
                                        JSON.stringify(t.signature)
                                    )
                                        return true;
                                }
                            })
                    );
                }
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

export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export function assertType(value, type, message) {
    const t = typeof value;
    if (t !== type) {
        throw new Error(
            message ||
                `Value < ${value.toString()} > is type "${t}", not type "${type}"`
        );
    }
}

export function arrayCycles(arr) {
    assertType(arr, "object");
    let arrCycles = [];
    for (let i = 0; i < 4; i++) {
        arr.unshift(arr.pop());
        arrCycles.push(JSON.parse(JSON.stringify(arr)));
    }
    return arrCycles;
}

function generateBinaries(str, res = []) {
    assertType(str, "string");
    assertType(res, "object");
    if (str.includes("?")) {
        let str1 = str.replace(/\?/, "0"); //only replace once
        let str2 = str.replace(/\?/, "1"); //only replace once
        generateBinaries(str1, res);
        generateBinaries(str2, res);
    } else {
        res.push(str);
    }
    return res;
}
