import p5 from "p5";
import {
    DIMENSION,
    TILE_WIDTH,
    TILE_HEIGHT,
    TILE_PORTS,
    PORT_WIDTH,
    PORT_HEIGHT,
    NUM_POSSIBLE_OPTIONS,
    PORT_ACTIVE_CHANCE,
    arrayCycles,
    assert,
    assertType,
} from "./WaveFunctionCollapse";

const SIDE_COLORS = {
    1: [0, 255, 0],
    2: [255, 100, 0],
    3: [255, 255, 0],
    4: [0, 150, 255],
};
const SIDE_DEFINITION = {
    1: "SIDE_TOP",
    2: "SIDE_RIGHT",
    3: "SIDE_BOTTOM",
    4: "SIDE_LEFT",
};
let _rotation = 0;

export default class Tile {
    constructor(
        p,
        index,
        forceOne = false,
        forceNone = false,
        forceAll = false,
        options = {}
    ) {
        this.options = options;
        this.img = p.createGraphics(TILE_WIDTH, TILE_HEIGHT);
        this.img.angleMode(p.DEGREES);
        this.img.rectMode(p.CENTER);
        this.img.translate(TILE_WIDTH / 2, TILE_HEIGHT / 2);
        this.index = index;
        this.row = Math.floor(this.index / DIMENSION);
        this.col = this.index % DIMENSION;
        this.x = this.col * TILE_WIDTH;
        this.y = this.row * TILE_HEIGHT;

        this.TILE_TOP = this.row - 1 >= 0 ? this.index - DIMENSION : null;
        this.TILE_RIGHT = this.col + 1 < DIMENSION ? this.index + 1 : null;
        this.TILE_BOTTOM =
            this.row + 1 < DIMENSION ? this.index + DIMENSION : null;
        this.TILE_LEFT = this.col - 1 >= 0 ? this.index - 1 : null;

        this.SIDE_TOP =
            this.SIDE_RIGHT =
            this.SIDE_BOTTOM =
            this.SIDE_LEFT =
                "";

        const generatePorts = () => {
            let oneActivePortsExists = false;
            let numActivePorts = 0;
            let ports = [...Array(TILE_PORTS * 4).keys()].map((portIndex) => {
                let port = new Port(portIndex, this, true, forceNone, forceAll);
                // console.log(port);
                if (port.side > 0 && port.active) {
                    oneActivePortsExists = true;
                    numActivePorts++;
                }
                if (port.active);
                return port;
            });

            if (!forceNone && forceOne && !oneActivePortsExists) {
                // console.log("We already have an EMPTY tile; regenerating...");
                return generatePorts();
            }
            if (!forceAll && numActivePorts === ports.length - 4) {
                // console.log("We already have a FULL tile; regenerating...");
                return generatePorts();
            }

            return ports;
        };

        this.setTileState((this.ports = generatePorts()), 0, false, true);
    }

    setTileState(
        ports,
        rotation,
        collapsed = false,
        omitPortsMap = false,
        isSignature = false
    ) {
        if (isSignature) {
            let portsSeparated = [];
            if (typeof ports === "string") {
                portsSeparated = ports.split("");
            } else if (typeof ports === "object") {
                let count = 0;
                ports.forEach((port) => {
                    if (count === DIMENSION) {
                        count = 0;
                    } else {
                        portsSeparated.push(...port.split(""));
                        count++;
                    }
                });
            }
            this.ports.forEach((port, i) => {
                port.active = Number(portsSeparated[i]);
            });
        }
        if (!omitPortsMap && !isSignature)
            this.ports.map((port) => {
                const referencePorts = ports;
                let referencePort;
                for (const refPort of referencePorts) {
                    if (refPort.index === port.index) {
                        referencePort = refPort;
                    }
                }
                port.active = referencePort.active;
                return port;
            });

        for (let i = 1; i < 5; i++) {
            this[SIDE_DEFINITION[i]] = "";
        }
        for (const port of this.ports) {
            if (port.side > 0)
                this[SIDE_DEFINITION[port.side]] += port.active ? "1" : "0";
        }

        const t = this.SIDE_TOP,
            r = this.SIDE_RIGHT,
            b = this.SIDE_BOTTOM,
            l = this.SIDE_LEFT;
        this.signature = [t, r, b, l];

        this.setRotation(rotation);
        this.rotationSignatures = {};
        this.rotationSignatures[t + r + b + l] = 0;
        this.rotationSignatures[l + t + r + b] = 90;
        this.rotationSignatures[b + l + t + r] = 180;
        this.rotationSignatures[r + b + l + t] = 270;

        this.collapsed = collapsed;
        console.log(this);
    }

    setRotation(rotation) {
        assertType(rotation, "number");
        assert(
            rotation % 90 === 0,
            `Rotation value < ${rotation} > is not a multiple of 90`
        );

        let sig = this.signature;
        this.rotation = rotation;
        if (this.rotation >= 360) this.rotation %= 360;
        _rotation = this.rotation;
        for (let i = 0; i < Math.floor(rotation / 90); i++) {
            sig.unshift(sig.pop());
        }
        this.VSIDE_TOP = [...sig[0]].reverse().join("");
        this.VSIDE_RIGHT = [...sig[1]].reverse().join("");
        this.VSIDE_BOTTOM = [...sig[2]].reverse().join("");
        this.VSIDE_LEFT = [...sig[3]].reverse().join("");
        return this.rotation;
    }

    addToRotation(rotation) {
        assertType(rotation, "number");
        assert(
            rotation % 90 === 0,
            `Rotation value < ${rotation} > must be a multiple of 90`
        );

        let sig = this.signature;
        this.rotation += rotation;
        if (this.rotation >= 360) this.rotation %= 360;
        _rotation = this.rotation;
        for (let i = 0; i < Math.floor(rotation / 90); i++) {
            sig.unshift(sig.pop());
        }
        this.VSIDE_TOP = sig[0];
        this.VSIDE_RIGHT = sig[1];
        this.VSIDE_BOTTOM = sig[2];
        this.VSIDE_LEFT = sig[3];
        return this.rotation;
    }

    draw(p, drawPattern = true, drawOutline = true, drawIndices = true) {
        assertType(p, "object");
        assertType(drawOutline, "boolean");
        assertType(drawPattern, "boolean");
        assertType(drawIndices, "boolean");

        this.img.clear();

        if (drawOutline) {
            this.img.push();
            this.img.strokeWeight(1);
            this.img.stroke(255, 0, 0);
            this.img.rotate(this.rotation);
            this.img.rect(0, 0, TILE_WIDTH, TILE_HEIGHT);
            this.img.pop();
        }
        if (drawPattern) {
            for (let i = 0; i < this.ports.length; i++) {
                let port = this.ports[i];
                if (port.active) {
                    this.img.push();
                    this.img.strokeWeight(100);
                    this.img.stroke(255, 255, 0);
                    this.img.rotate(this.rotation);
                    this.drawLineAtPort(p, port);
                    this.img.pop();
                }
            }
        }
        if (drawIndices) {
            for (let port of this.ports) {
                this.img.push();
                this.img.rotate(this.rotation);
                port.draw();
                this.img.pop();
            }
            this.img.push();
            this.img.fill(255, 200, 0);
            this.img.strokeWeight(3);
            this.img.stroke(0);
            this.img.textAlign(this.img.CENTER);
            this.img.textSize(14);
            this.img.textStyle(this.img.BOLD);
            this.img.text(this.index, 0, 3);
            this.img.pop();
            this.img.push();
            this.img.strokeWeight(1);
            this.img.fill(0);
            this.img.text(`(${this.x}, ${this.y})`, 0, 0);
            this.img.pop();
        }

        p.push();
        this.img.strokeWeight(2);
        this.img.stroke(255);
        this.img.textAlign(this.img.CENTER);
        this.img.textSize(Math.round(TILE_WIDTH / 5));
        this.img.fill(255, 0, 0);
        this.img.text(Object.keys(this.options).length, 0, 5);
        this.img.fill(255);
        p.pop();

        p.image(this.img, this.x, this.y);
    }

    drawLineAtPort(p, port) {
        assertType(p, "object");
        assertType(port, "object");

        p.push();
        this.img.noStroke();
        this.img.fill(0);
        this.img.translate(
            -TILE_WIDTH / 2 - TILE_WIDTH * this.col,
            -TILE_HEIGHT / 2 - TILE_HEIGHT * this.row
        );
        const rectWidth = TILE_WIDTH / (TILE_PORTS * 4);
        const rectHeight = TILE_HEIGHT / 2 + rectWidth / 2;
        switch (port.side) {
            case 1:
                this.img.translate(0, rectHeight / 2);
                this.img.rect(port.x, port.y, rectWidth, rectHeight);
                break;
            case 2:
                this.img.translate(rectHeight / 2, rectWidth);
                this.img.rect(
                    port.x - rectHeight,
                    port.y - rectWidth,
                    rectHeight,
                    rectWidth
                );
                break;
            case 3:
                this.img.translate(rectWidth, 0);
                this.img.rect(
                    port.x - rectWidth,
                    port.y - rectHeight / 2,
                    rectWidth,
                    rectHeight
                );
                break;
            case 4:
                this.img.translate(rectHeight / 2, 0);
                this.img.rect(port.x, port.y, rectHeight, rectWidth);
                break;
            case -1:
                break;
            case -2:
                break;
            case -3:
                break;
            case -4:
                break;
        }
        p.pop();
    }

    randomizeActivePorts() {
        this.ports = this.ports.map((port) => {
            port.active = Math.random() < 0.5;
        });
    }
}

class Port {
    constructor(
        index,
        tile,
        drawIndices = true,
        forceNone = false,
        forceAll = false
    ) {
        this.index = index;
        this.tile = tile;
        this.side = Math.floor(index / TILE_PORTS) + 1;

        if (this.side > 0) this.active = Math.random() < PORT_ACTIVE_CHANCE;
        if ((forceNone && !forceAll) || (forceNone && forceAll))
            this.active = false;
        if (forceAll && !forceNone) this.active = true;

        const tileX = tile.x;
        const tileY = tile.y;
        this.drawIndices = drawIndices;
        const offset = index % TILE_PORTS;
        if (this.side === 1) {
            this.x = tileX + offset * PORT_WIDTH;
            this.y = tileY;
        } else if (this.side === 2) {
            this.x = tileX + TILE_WIDTH;
            this.y = tileY + offset * PORT_HEIGHT;
        } else if (this.side === 3) {
            this.x = tileX + TILE_WIDTH - offset * PORT_WIDTH;
            this.y = tileY + TILE_HEIGHT;
        } else if (this.side === 4) {
            this.x = tileX;
            this.y = tileY + TILE_HEIGHT - offset * PORT_HEIGHT;
        } else {
            this.x = this.y = undefined;
        }
        if (this.index % TILE_PORTS === 0) {
            this.side = -(Math.floor(this.index / TILE_PORTS) + 1);
        }
        this.rotation = _rotation;
        // console.log(`Tile (X, Y): (${tileX}, ${tileY})\nPort (Index, X, Y): (${this.index}, ${this.x}, ${this.y})`);
    }

    draw() {
        this.tile.img.push();
        this.tile.img.translate(
            -TILE_WIDTH / 2 - TILE_WIDTH * this.tile.row,
            -TILE_HEIGHT / 2 - TILE_HEIGHT * this.tile.col
        );
        this.tile.img.stroke(0);
        this.tile.img.strokeWeight(10);
        let sideColor = [100, 100, 100, 100];
        if (this.side > 0) {
            sideColor = SIDE_COLORS[this.side];
        }
        this.tile.img.stroke(...sideColor);
        this.tile.img.point(this.x, this.y);
        if (this.drawIndices) {
            this.tile.img.stroke(...sideColor);
            const textOffset = 15;
            let xOff = 0,
                yOff = 3;
            switch (this.side) {
                case 1:
                    xOff += this.x;
                    yOff += this.y + textOffset;
                    break;
                case 2:
                    xOff += this.x - textOffset;
                    yOff += this.y;
                    break;
                case 3:
                    xOff += this.x;
                    yOff += this.y - textOffset;
                    break;
                case 4:
                    xOff += this.x + textOffset;
                    yOff += this.y;
                    break;
                case -1:
                    xOff += this.x + textOffset;
                    yOff += this.y + textOffset;
                    break;
                case -2:
                    xOff += this.x - textOffset;
                    yOff += this.y + textOffset;
                    break;
                case -3:
                    xOff += this.x - textOffset;
                    yOff += this.y - textOffset;
                    break;
                case -4:
                    xOff += this.x + textOffset;
                    yOff += this.y - textOffset;
                    break;
            }
            this.tile.img.strokeWeight(5);
            this.tile.img.textAlign(this.tile.img.CENTER);
            this.tile.img.textFont("Georgia");
            this.tile.img.textSize(10);
            this.tile.img.fill(0);
            this.tile.img.text(this.index, xOff, yOff);
        }
        this.tile.img.pop();
    }
}
