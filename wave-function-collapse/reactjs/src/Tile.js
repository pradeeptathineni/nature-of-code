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
    1: [255, 100, 100],
    2: [255, 255, 0],
    3: [100, 150, 255],
};

let ORIENTATION = 0;

export default class Tile {
    constructor(index) {
        this.index = index;
        this.row = Math.floor(this.index / DIMENSION);
        this.col = this.index % DIMENSION;
        this.x = this.row * TILE_WIDTH;
        this.y = this.col * TILE_HEIGHT;
        this.ports = [...Array(TILE_PORTS * 4).keys()].map(
            (index) => new Port(index, this.x, this.y)
        );
        this.orientation = 0;
    }

    setOrientation(orientation) {
        this.orientation = orientation;
        ORIENTATION = orientation;
        return this.orientation;
    }

    addToOrientation(orientation) {
        this.orientation += orientation;
        ORIENTATION += orientation;
        return this.orientation;
    }

    rotateTile(p, degrees = this.orientation) {
        p.push();
        p.translate(this.x + TILE_WIDTH / 2, this.y + TILE_HEIGHT / 2);
        p.rotate(degrees);
        p.translate(-TILE_WIDTH / 2, -TILE_HEIGHT / 2);
        p.pop();
    }

    showOutline(p) {
        p.push();
        p.strokeWeight(5);
        p.stroke(255, 0, 0);
        p.noFill();
        this.rotateTile(p);
        p.rect(this.x, this.y, TILE_WIDTH, TILE_HEIGHT);
        p.pop();
    }

    showPattern(p) {
        for (let i = 0; i < this.ports.length; i++) {
            let port = this.ports[i];
            if (port.active) {
                p.push();
                this.rotateTile(p); // when I add this in,drawing port labels and dots messes up
                this.drawLineAtPort(p, port);
                p.pop();
            }
        }
    }

    drawLineAtPort(p, port) {
        p.noStroke();
        p.fill(0);
        const rectWidth = TILE_WIDTH / (TILE_PORTS * 4);
        const rectHeight = TILE_HEIGHT / 1.42;
        switch (port.side) {
            case 0:
                p.translate(-rectWidth / 2, 0);
                p.rect(port.x, port.y, rectWidth, rectHeight);
                break;
            case 1:
                p.translate(0, rectWidth / 2);
                p.rect(
                    port.x - rectHeight,
                    port.y - rectWidth,
                    rectHeight,
                    rectWidth
                );
                break;
            case 2:
                p.translate(rectWidth / 2, 0);
                p.rect(
                    port.x - rectWidth,
                    port.y - rectHeight,
                    rectWidth,
                    rectHeight
                );
                break;
            case 3:
                p.translate(0, -rectWidth / 2);
                p.rect(port.x, port.y, rectHeight, rectWidth);
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
    }

    randomizeActivePorts() {
        this.ports = this.ports.map((port) => {
            port.active = Math.random() < 0.5;
        });
    }
}

class Port {
    constructor(index, tileX, tileY) {
        this.index = index;
        this.active = Math.random() < 0.5;
        this.side = Math.floor(index / TILE_PORTS);
        this.tileX = tileX;
        this.tileY = tileY;
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

    display(p, showIndices = true) {
        p.push();
        p.strokeWeight(5);
        p.textFont("Georgia");
        p.textSize(14);
        let sideColor = [100, 100, 100, 100];
        if (this.side >= 0) {
            sideColor = SIDE_COLORS[this.side];
        }
        p.stroke(...sideColor);
        // this.rotatePort(p); // when I add this in,drawing port labels and dots messes up
        p.point(this.x, this.y);
        if (showIndices) {
            p.stroke(...sideColor);
            const textOffset = 15;
            let xOff, yOff;
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
            p.text(this.index, xOff, yOff);
        }
        p.pop();
    }

    rotatePort(p, degrees = ORIENTATION) {
        p.translate(this.tileX + TILE_WIDTH / 2, this.tileY + TILE_HEIGHT / 2);
        p.rotate(degrees);
        p.translate(this.tileX - TILE_WIDTH / 2, this.tileY - TILE_HEIGHT / 2);
    }
}
