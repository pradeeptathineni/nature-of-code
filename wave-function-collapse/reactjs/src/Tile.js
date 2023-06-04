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
} from "./WaveFunctionCollapse";

const SIDE_COLORS = {
    1: [0, 255, 0],
    2: [255, 100, 0],
    3: [255, 255, 0],
    4: [0, 150, 255],
};

let _rotation = 0;

export default class Tile {
    constructor(
        p,
        index,
        forceOne = false,
        forceNone = false,
        forceAll = false,
        options,
        ports
    ) {
        this.options =
            options === undefined
                ? [[...Array(NUM_POSSIBLE_OPTIONS).keys()]]
                : options;
        this.img = p.createGraphics(TILE_WIDTH, TILE_HEIGHT);
        this.img.angleMode(p.DEGREES);
        this.img.rectMode(p.CENTER);
        this.img.translate(TILE_WIDTH / 2, TILE_HEIGHT / 2);
        this.index = index;
        this.row = this.index % DIMENSION;
        this.col = Math.floor(this.index / DIMENSION);
        this.x = this.row * TILE_WIDTH;
        this.y = this.col * TILE_HEIGHT;

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
        this.ports = ports === undefined ? generatePorts(ports) : ports;

        // console.log("ports:", this.ports);
        this.TOP = this.RIGHT = this.BOTTOM = this.LEFT = "";
        let sideDefinition = {
            1: "TOP",
            2: "RIGHT",
            3: "BOTTOM",
            4: "LEFT",
        };
        for (let i in this.ports) {
            let port = this.ports[i];
            if (port.side > 0) {
                this[sideDefinition[port.side]] += port.active ? "1" : "0";
            }
        }
        const t = this.TOP,
            r = this.RIGHT,
            b = this.BOTTOM,
            l = this.LEFT;
        this.signatures = [
            t + r + b + l,
            r + b + l + t,
            b + l + t + r,
            r + b + l + t,
        ];
        this.rotation = 0;
        // console.log(
        //     `Tile:\t\t${index}\nw*h:\t\t${TILE_WIDTH}*${TILE_HEIGHT}\n(X, Y):\t\t(${this.x}, ${this.y})\n(row, col):\t\t(${this.row}, ${this.col})`
        // );
    }

    setRotation(rotation) {
        if (rotation >= 360) rotation %= 360;
        this.rotation = rotation;
        _rotation = rotation;
        return this.rotation;
    }

    addToRotation(rotation) {
        this.rotation += rotation;
        if (this.rotation >= 360) this.rotation %= 360;
        _rotation = this.rotation;

        return this.rotation;
    }

    draw(p, drawOutline = true, drawPattern = true, drawIndices = true) {
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
        p.image(this.img, this.x, this.y);
    }

    drawLineAtPort(p, port) {
        p.push();
        this.img.noStroke();
        this.img.fill(0);
        this.img.translate(
            -TILE_WIDTH / 2 - TILE_WIDTH * this.row,
            -TILE_HEIGHT / 2 - TILE_HEIGHT * this.col
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

    draw(p) {
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
