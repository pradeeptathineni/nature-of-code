import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function Moire() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let grid, grid2;
    let gridMoveSpeed = 4;
    let keysPressed = new Map();

    useEffect(() => {
        const sketch = new p5((p) => {
            p.setup = () => {
                p.createCanvas(width, height);
                p.angleMode(p.DEGREES);
                grid = new Grid(0, 0, 20, 10, 20, 10, 10, 10);
                // grid2 = new Grid(0, 0, 40, 40, 40, 40, 10, 10);
            };

            p.draw = () => {
                p.background(255);
                p.stroke(0);
                p.fill(0);
                grid.moveWithArrowKeys();
                grid.display();
                // grid2.moveWithMouse();
                // grid2.display();
                // p.push();
                // p.fill(255, 0, 0);
                // p.ellipse(0, 0, 20, 20);
                // p.pop();
            };

            function Grid(
                xStart = 0,
                yStart = 0,
                vN = 20,
                hN = 10,
                vW = 10,
                hW = 1,
                vS = 10,
                hS = 40,
                drawVerticals = true,
                drawHorizontals = true
            ) {
                this.x = xStart;
                this.y = yStart;
                this.vertNum = vN;
                this.horizNum = hN;
                this.vertWidth = vW;
                this.horizWidth = hW;
                this.vertSpace = vS;
                this.horizSpace = hS;
                this.gridWidth = (vN - 1) * (vW + vS);
                this.gridHeight = (hN - 1) * (hW + hS);
                this.middleX = this.x + this.gridWidth / 2;
                this.middleY = this.y + this.gridHeight / 2;
                this.underneath = this.gridHeight + 10;
                this.rotateAngle = 0;

                this.moveWithMouse = function () {
                    this.x = p.mouseX - this.middleX;
                    this.y = p.mouseY - this.underneath;
                };

                this.moveWithArrowKeys = function () {
                    if (p.keyIsDown(65) || p.keyIsDown(p.LEFT_ARROW))
                        this.x -= gridMoveSpeed;
                    if (p.keyIsDown(68)) this.x += gridMoveSpeed;
                    if (p.keyIsDown(87)) this.y -= gridMoveSpeed;
                    if (p.keyIsDown(83)) this.y += gridMoveSpeed;
                };

                this.rotation = function () {
                    if (p.keyIsDown(81)) {
                        this.rotateAngle -= 1;
                    } else if (p.keyIsDown(69)) {
                        this.rotateAngle += 1;
                    }
                };

                this.display = function () {
                    p.stroke(0);
                    this.rotation();
                    p.push();
                    p.translate(this.x + this.middleX, this.y + this.middleY);
                    p.rotate(this.rotateAngle);
                    p.translate(-this.x - this.middleX, -this.y - this.middleY);
                    drawVerticals && this.drawVerticals();
                    drawHorizontals && this.drawHorizontals();
                    p.pop();
                };

                this.drawVerticals = function () {
                    // fill(0, 200);
                    for (var ix = 0; ix < this.vertNum; ix++) {
                        p.rect(
                            this.x + ix * (this.vertSpace + this.vertWidth),
                            this.y,
                            this.vertWidth,
                            this.gridHeight + this.horizWidth
                        );
                    }
                };

                this.drawHorizontals = function () {
                    // fill(0, 50);
                    for (var iy = 0; iy < this.horizNum; iy++) {
                        p.rect(
                            this.x,
                            this.y + iy * (this.horizSpace + this.horizWidth),
                            this.gridWidth + this.vertWidth,
                            this.horizWidth
                        );
                    }
                };
            }

            onkeydown = function (e) {
                e = e || event; // to deal with IE
                keysPressed[e.key] = e.type == "keydown";
            };
            onkeyup = function (e) {
                delete keysPressed[e.key];
            };
        }, canvasRef.current);

        return sketch.remove;
    }, []);

    return <div ref={canvasRef} />;
}
