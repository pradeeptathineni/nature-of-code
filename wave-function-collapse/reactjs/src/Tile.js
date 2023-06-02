import p5 from "p5";
import {
    DIMENSION,
    TILE_WIDTH,
    TILE_HEIGHT,
    TILE_PORTS,
    PORT_WIDTH,
    PORT_HEIGHT,
} from "./WaveFunctionCollapse";

const SIDE_COLORS = {
    0: [0, 255, 0],
    1: [255, 100, 0],
    2: [255, 200, 0],
    3: [0, 150, 255],
};

let ORIENTATION = 0;

export default class Tile {
    constructor(
        p,
        index,
        drawPattern = true,
        drawOutline = true,
        drawIndices = true
    ) {
        this.img = p.createGraphics(TILE_WIDTH, TILE_HEIGHT);
        this.img.angleMode(p.DEGREES);
        this.img.rectMode(p.CENTER);
        this.img.translate(TILE_WIDTH / 2, TILE_HEIGHT / 2);
        this.index = index;
        this.row = Math.floor(this.index / DIMENSION);
        this.col = this.index % DIMENSION;
        this.x = this.row * TILE_WIDTH;
        this.y = this.col * TILE_HEIGHT;
        this.ports = [...Array(TILE_PORTS * 4).keys()].map(
            (index) => new Port(index, this)
        );
        this.orientation = 0;
        this.drawPattern = drawPattern;
        this.drawOutline = drawOutline;
        this.drawIndices = drawIndices;
        // console.log(
        //     `Tile:\t\t${index}\nw*h:\t\t${TILE_WIDTH}*${TILE_HEIGHT}\n(X, Y):\t\t(${this.x}, ${this.y})\n(row, col):\t\t(${this.row}, ${this.col})`
        // );
    }

    setOrientation(orientation) {
        if (orientation >= 360) orientation %= 360;
        this.orientation = orientation;
        ORIENTATION = orientation;
        return this.orientation;
    }

    addToOrientation(orientation) {
        this.orientation += orientation;
        if (this.orientation >= 360) this.orientation %= 360;
        ORIENTATION = this.orientation;

        return this.orientation;
    }

    draw(p, drawOutline = true, drawPattern = true, drawIndices = true) {
        p.push();
        this.img.clear();
        if (drawOutline) {
            this.img.push();
            this.img.strokeWeight(1);
            this.img.stroke(255, 0, 0);
            this.img.rotate(this.orientation);
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
                    this.img.rotate(this.orientation);
                    this.drawLineAtPort(p, port);
                    this.img.pop();
                }
            }
        }
        if (drawIndices) {
            for (let port of this.ports) {
                this.img.push();
                this.img.rotate(this.orientation);
                port.draw(p);
                this.img.pop();
            }
        }
        p.image(this.img, this.x, this.y);
        p.pop();
    }

    drawLineAtPort(p, port) {
        this.img.push();
        this.img.noStroke();
        this.img.fill(0);
        this.img.translate(
            -TILE_WIDTH / 2 - TILE_WIDTH * this.row,
            -TILE_HEIGHT / 2 - TILE_HEIGHT * this.col
        );
        const rectWidth = TILE_WIDTH / (TILE_PORTS * 4);
        const rectHeight = TILE_HEIGHT / 1.42;
        switch (port.side) {
            case 0:
                this.img.translate(0, rectHeight / 2);
                this.img.rect(port.x, port.y, rectWidth, rectHeight);
                break;
            case 1:
                this.img.translate(rectHeight / 2, rectWidth);
                this.img.rect(
                    port.x - rectHeight,
                    port.y - rectWidth,
                    rectHeight,
                    rectWidth
                );
                break;
            case 2:
                this.img.translate(rectWidth, 0);
                this.img.rect(
                    port.x - rectWidth,
                    port.y - rectHeight / 2,
                    rectWidth,
                    rectHeight
                );
                break;
            case 3:
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
        this.img.pop();
    }

    randomizeActivePorts() {
        this.ports = this.ports.map((port) => {
            port.active = Math.random() < 0.5;
        });
    }
}

class Port {
    constructor(index, tile, drawIndices = true) {
        this.index = index;
        this.tile = tile;
        this.active = Math.random() < 0.5;
        this.side = Math.floor(index / TILE_PORTS);
        const tileX = tile.x;
        const tileY = tile.y;
        this.drawIndices = drawIndices;
        const offset = index % TILE_PORTS;
        if (this.side === 0) {
            this.x = tileX + offset * PORT_WIDTH;
            this.y = tileY;
        } else if (this.side === 1) {
            this.x = tileX + TILE_WIDTH;
            this.y = tileY + offset * PORT_HEIGHT;
        } else if (this.side === 2) {
            this.x = tileX + TILE_WIDTH - offset * PORT_WIDTH;
            this.y = tileY + TILE_HEIGHT;
        } else if (this.side === 3) {
            this.x = tileX;
            this.y = tileY + TILE_HEIGHT - offset * PORT_HEIGHT;
        } else {
            this.x = this.y = undefined;
        }
        if (this.index % TILE_PORTS === 0) {
            this.side = -(Math.floor(this.index / TILE_PORTS) + 1);
        }
        this.orientation = ORIENTATION;
        // console.log(`Tile (X, Y): (${tileX}, ${tileY})\nPort (Index, X, Y): (${this.index}, ${this.x}, ${this.y})`);
    }

    draw(p) {
        this.tile.img.push();
        this.tile.img.translate(
            -TILE_WIDTH / 2 - TILE_WIDTH * this.tile.row,
            -TILE_HEIGHT / 2 - TILE_HEIGHT * this.tile.col
        );
        this.tile.img.stroke(0);
        this.tile.img.strokeWeight(5);
        let sideColor = [100, 100, 100, 100];
        if (this.side >= 0) {
            sideColor = SIDE_COLORS[this.side];
        }
        this.tile.img.stroke(...sideColor);
        this.tile.img.point(this.x, this.y);
        if (this.drawIndices) {
            this.tile.img.stroke(...sideColor);
            const textOffset = 15;
            let xOff = 0,
                yOff = 0;
            switch (this.side) {
                case 0:
                    xOff = this.x;
                    yOff = this.y + textOffset;
                    break;
                case 1:
                    xOff = this.x - textOffset;
                    yOff = this.y;
                    break;
                case 2:
                    xOff = this.x;
                    yOff = this.y - textOffset;
                    break;
                case 3:
                    xOff = this.x + textOffset * 0.5;
                    yOff = this.y;
                    break;
                case -1:
                    xOff = this.x + textOffset;
                    yOff = this.y + textOffset;
                    break;
                case -2:
                    xOff = this.x - textOffset;
                    yOff = this.y + textOffset;
                    break;
                case -3:
                    xOff = this.x - textOffset;
                    yOff = this.y - textOffset;
                    break;
                case -4:
                    xOff = this.x + textOffset;
                    yOff = this.y - textOffset;
                    break;
            }
            this.tile.img.textFont("Georgia");
            this.tile.img.textSize(10);
            this.tile.img.text(this.index, xOff, yOff);
        }
        this.tile.img.pop();
    }
}
