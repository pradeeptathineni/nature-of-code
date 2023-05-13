import React, { useState, useRef, useEffect } from "react";
import p5 from "p5";
import { GifReader } from "omggif";

export default function Moire() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cursor = "default";

    const [selectedFile, setSelectedFile] = useState(null);
    const [fileData, setFileData] = useState(null);

    let img;
    let imageDataBlobs = [];
    let p5Images = [];

    const [gifFrames, setFrames] = useState([]);
    let currentFrameIndex = 0;
    let totalDelay = 0;

    let staticGrid, moveGrid;
    let gridMoveSpeed = 4;
    let scaleFactor = 13;
    let gridLineWidth = 20;
    let gridLineSpacing = 20;

    async function handleFileInputChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);

        const reader = new FileReader();
        const { type } = file;
        console.log(type);
        if (type === "image/png" || type === "image/jpeg") {
            reader.onload = (e) => {
                setFileData(e.target.result);
                imageDataBlobs.push(e.target.result);
            };
            reader.readAsDataURL(file);
        } else if (type === "image/gif" || type === "video/mp4") {
            reader.onload = (event) => {
                const gif = new GifReader(new Uint8Array(event.target.result));
                const gifFrames = [];

                // Set the transparent flag to true
                gif.transparency = true;

                for (let i = 0; i < gif.numFrames(); i++) {
                    const frame = gif.frameInfo(i);

                    // Create a new ImageData object with the RGBA data
                    const imageData = new ImageData(gif.width, gif.height);
                    gif.decodeAndBlitFrameRGBA(i, imageData.data);

                    // Push the frame data to the gifFrames array
                    gifFrames.push({
                        data: imageData.data,
                        width: frame.width,
                        height: frame.height,
                        delay: frame.delay * 10,
                    });
                }

                setFrames(gifFrames);
            };

            reader.readAsArrayBuffer(file);
        } else {
            console.log("Unsupported file type.");
        }
    }

    useEffect(() => {
        const sketch = new p5((p) => {
            p.preload = () => {
                preloadFile(fileData);
                console.log("preloaded");
            };
            p.setup = () => {
                p.createCanvas(width, height);
                p.noSmooth();
                p.angleMode(p.DEGREES);
                p.frameRate(3);
                if (gifFrames.length > 0) {
                    img = p.createImage(
                        gifFrames[0].width,
                        gifFrames[0].height
                    );
                }
                console.log("setuped");
            };

            p.draw = () => {
                p.background(255);
                p.stroke(0);
                p.fill(0);
                p.cursor(cursor);
                if (p5Images.length > 0) {
                    let image = p5Images[0];
                    drawImage(image);
                }
                if (gifFrames.length > 0) {
                    const currentFrame = gifFrames[currentFrameIndex];
                    const delay = currentFrame.delay;

                    totalDelay += p.deltaTime;
                    if (totalDelay >= delay) {
                        totalDelay = 0;
                        currentFrameIndex =
                            (currentFrameIndex + 1) % gifFrames.length;
                    }

                    let w = currentFrame.width;
                    let h = currentFrame.height;
                    let data = currentFrame.data;

                    img.loadPixels();
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const pixelIndex = (y * w + x) * 4;
                            const r = data[pixelIndex];
                            const g = data[pixelIndex + 1];
                            const b = data[pixelIndex + 2];
                            const brightness = (r + g + b) / 3;
                            img.pixels[pixelIndex] = data[pixelIndex];
                            img.pixels[pixelIndex + 1] = data[pixelIndex + 1];
                            img.pixels[pixelIndex + 2] = data[pixelIndex + 2];
                            img.pixels[pixelIndex + 3] = data[pixelIndex + 3];
                        }
                    }
                    img.updatePixels();

                    let gifFrameP5Image = new P5Image(img, 10, 10);
                    gifFrameP5Image.show();
                }
            };

            p.mousePressed = () => {};

            p.mouseReleased = () => {};

            function preloadFile(data) {
                if (gifFrames.length > 0) {
                    console.log(gifFrames);
                }
                if (data) {
                    const { type } = selectedFile;
                    if (type === "image/png" || type === "image/jpeg") {
                        img = p.loadImage(
                            data,
                            () => {
                                console.log("succeeded to load");
                            },
                            () => {
                                console.log("failed to load");
                            }
                        );
                        p5Images.push(new P5Image(img, 0, 0));
                    } else if (type === "image/gif" || type === "video/mp4") {
                        if (gifFrames.length > 0) console.log(gifFrames);
                    } else {
                        console.log("Unsupported file type.");
                    }
                }
            }

            function alterImagePixels(w, h, alteration = "grid") {
                p.loadPixels();
                switch (alteration) {
                    case "grid":
                        let _gridLineWidth = gridLineWidth;
                        for (let x = 0; x < w; x++) {
                            if (_gridLineWidth > 0) {
                                // The RGBA values are represented as an array of four values (Red, Green, Blue, and Alpha) for each pixel.
                                // The pixels array will have a length of w * h * 4 because each pixel is represented by four values.
                                for (let y = 0; y < h * 4; y++) {
                                    const index = (x + y * w) * 4;
                                    p.pixels[index + 3] = 0;
                                }
                                _gridLineWidth--;
                            } else {
                                x += gridLineSpacing;
                                _gridLineWidth = gridLineWidth;
                            }
                        }
                        break;
                    case "bw":
                        for (let x = 0; x < w; x++) {
                            for (let y = 0; y < h * 4; y++) {
                                const index = (x + y * w) * 4;
                                const avg = Math.round(
                                    (p.pixels[index] +
                                        p.pixels[index + 1] +
                                        p.pixels[index + 2]) /
                                        3
                                );
                                p.pixels[index] = avg;
                                p.pixels[index + 1] = avg;
                                p.pixels[index + 2] = avg;
                            }
                        }
                        break;
                    default:
                        console.log("Not a valid alteration type");
                }
                p.updatePixels();
            }

            function drawImage(p5Image) {
                if (p5Image.data) {
                    const scaleRatio = width / p5Image.data.width;
                    p5Image.data.width *= scaleRatio;
                    p5Image.data.height *= scaleRatio;
                    const w = p5Image.data.width;
                    const h = p5Image.data.height;
                    p5Image.move();
                    p5Image.show();
                    alterImagePixels(w, h, "bw");
                }
            }

            function gridTestSetup() {
                moveGrid = new Grid(0, 0, 40, 40, 4, 4, 4, 4, true, false);
                staticGrid = new Grid(
                    0,
                    0,
                    p.map(scaleFactor, 0, 100, 0, width),
                    p.map(scaleFactor, 0, 100, 0, height),
                    4,
                    4,
                    4,
                    4
                );
                moveGrid = new Grid(
                    0,
                    0,
                    p.map(scaleFactor, 0, 100, 0, width),
                    p.map(scaleFactor, 0, 100, 0, height),
                    4,
                    4,
                    4,
                    4,
                    true,
                    false
                );
                keyboardGrid = new Grid(0, 0, 20, 10, 10, 10, 10, 10);
            }

            function gridTestDraw() {
                staticGrid.display();
                moveGrid.rotation();
                moveGrid.scaling();
                moveGrid.moveWithArrowKeys();
                moveGrid.display();
                keyboardGrid.moveWithArrowKeys();
                keyboardGrid.rotation();
                keyboardGrid.scaling();
                keyboardGrid.display();
                grid2.moveWithMouse();
                grid2.display();
                p.push();
                p.fill(255, 0, 0);
                p.ellipse(0, 0, 20, 20);
                p.pop();
            }

            function P5Image(data, x, y) {
                this.data = Object.seal(data);
                this.x = x;
                this.y = y;
                this.dragging = false;
                this.resizing = false;
                this.offsetX = 0;
                this.offsetY = 0;
                this.lastMouseDragPosX = 0;
                this.lastMouseDragPosY = 0;
                this.lastMouseResizePosX = 0;
                this.lastMouseResizePosY = 0;
                this.resizeCornerSize = 10;

                this.show = function () {
                    p.image(
                        this.data,
                        this.x,
                        this.y,
                        this.data.width,
                        this.data.height
                    );
                    // this.drawResizeCorners();
                    // this.resize();
                };

                this.drawResizeCorners = function () {
                    let w = this.data.width;
                    let h = this.data.height;
                    let imgX = this.x;
                    let imgY = this.y;
                    let cornerSize = this.resizeCornerSize;

                    p.noFill();
                    p.strokeWeight(2);
                    p.stroke(255);
                    p.rect(imgX, imgY, w, h);

                    // Top left corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(
                        imgX - cornerSize / 2,
                        imgY - cornerSize / 2,
                        cornerSize,
                        cornerSize
                    );
                    // Top right corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(
                        imgX + w - cornerSize / 2,
                        imgY - cornerSize / 2,
                        cornerSize,
                        cornerSize
                    );
                    // Bottom left corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(
                        imgX - cornerSize / 2,
                        imgY + h - cornerSize / 2,
                        cornerSize,
                        cornerSize
                    );
                    // Bottom right corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(
                        imgX + w - cornerSize / 2,
                        imgY + h - cornerSize / 2,
                        cornerSize,
                        cornerSize
                    );
                };

                this.isOverCorner = function () {
                    let w = this.data.width;
                    let h = this.data.height;
                    let mX = p.mouseX;
                    let mY = p.mouseY;
                    let imgX = this.x;
                    let imgY = this.y;
                    let cornerSize = this.resizeCornerSize / 2;
                    let isOverCorner = false;
                    if (
                        mX > imgX - cornerSize &&
                        mX < imgX + cornerSize &&
                        mY > imgY - cornerSize &&
                        mY < imgY + cornerSize
                    ) {
                        cursor = "nwse-resize";
                        isOverCorner = true;
                    } else if (
                        mX > imgX + w - cornerSize &&
                        mX < imgX + w + cornerSize &&
                        mY > imgY - cornerSize &&
                        mY < imgY + cornerSize
                    ) {
                        cursor = "nesw-resize";
                        isOverCorner = true;
                    } else if (
                        mX > imgX - cornerSize &&
                        mX < imgX + cornerSize &&
                        mY > imgY + h - cornerSize &&
                        mY < imgY + h + cornerSize
                    ) {
                        cursor = "nesw-resize";
                        isOverCorner = true;
                    } else if (
                        mX > imgX + w - cornerSize &&
                        mX < imgX + w + cornerSize &&
                        mY > imgY + h - cornerSize &&
                        mY < imgY + h + cornerSize
                    ) {
                        cursor = "nwse-resize";
                        isOverCorner = true;
                    } else {
                        cursor = "default";
                        isOverCorner = false;
                    }
                    p.cursor(cursor);
                    return isOverCorner;
                };

                this.setResizing = function () {
                    if (this.isOverCorner()) {
                        this.resizing = true;
                        this.offsetX = p.mouseX - this.x;
                        this.offsetY = p.mouseY - this.y;
                    } else {
                        this.resizing = false;
                        this.lastMouseResizePosX = null;
                        this.lastMouseResizePosY = null;
                    }
                };

                this.resize = function () {
                    this.setResizing();
                    if (this.resizing && p.mouseIsPressed) {
                        this.isOverCorner();
                        if (
                            this.lastMouseResizePosX &&
                            this.lastMouseResizePosY
                        ) {
                            var dx = p.mouseX - this.lastMouseResizePosX;
                            var dy = p.mouseY - this.lastMouseResizePosY;
                            switch (cursor) {
                                case "nwse-resize":
                                    this.x += dx;
                                    this.y += dy;
                                    this.data.width -= dx;
                                    this.data.height -= dy;
                                    console.log("test1");
                                    break;
                                case "nesw-resize":
                                    this.y += dy;
                                    this.data.width += dx;
                                    this.data.height -= dy;
                                    console.log("test2");
                                    break;
                                case "nesw-resize":
                                    this.x += dx;
                                    this.data.width -= dx;
                                    this.data.height += dy;
                                    console.log("test3");
                                    break;
                                case "nwse-resize":
                                    this.data.width += dx;
                                    this.data.height += dy;
                                    console.log("test4");
                                    break;
                            }
                        } else {
                            this.lastMouseResizePosX = p.mouseX;
                            this.lastMouseResizePosY = p.mouseY;
                        }
                    }
                };

                this.isOverDraggable = function () {
                    let padding = 20;
                    let isOverDraggable = false;
                    if (
                        p.mouseX > this.x + padding &&
                        p.mouseX < this.x + this.data.width - padding &&
                        p.mouseY > this.y + padding &&
                        p.mouseY < this.y + this.data.height - padding
                    ) {
                        cursor = "grab";
                        isOverDraggable = true;
                    } else {
                        cursor = "default";
                        isOverDraggable = false;
                    }
                    p.cursor(cursor);
                    return isOverDraggable;
                };

                this.setDragging = function () {
                    if (this.isOverDraggable() && p.mouseIsPressed) {
                        this.dragging = true;
                        this.offsetX = p.mouseX - this.x;
                        this.offsetY = p.mouseY - this.y;
                    } else {
                        this.dragging = false;
                        this.lastMouseDragPosX = null;
                        this.lastMouseDragPosY = null;
                    }
                };

                this.move = function () {
                    this.setDragging();
                    if (this.dragging && p.mouseIsPressed) {
                        cursor = "grabbing";
                        p.cursor(cursor);
                        if (this.lastMouseDragPosX && this.lastMouseDragPosY) {
                            this.offsetX = p.mouseX - this.lastMouseDragPosX;
                            this.offsetY = p.mouseY - this.lastMouseDragPosY;
                            this.x += this.offsetX;
                            this.y += this.offsetY;
                        }
                        this.lastMouseDragPosX = p.mouseX;
                        this.lastMouseDragPosY = p.mouseY;
                    }
                };
            }

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
                this.scale = p.createVector(1, 1);

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

                this.scaling = function () {
                    if (p.keyIsDown(79)) {
                        this.scale.sub(0.01, 0.01);
                    } else if (p.keyIsDown(80)) {
                        this.scale.add(0.01, 0.01);
                    }
                };

                this.display = function () {
                    p.stroke(0);
                    p.push();
                    p.scale(this.scale.x, this.scale.y);
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

            // onkeydown = function (e) {
            //     e = e || event; // to deal with IE
            //     keysPressed[e.key] = e.type == "keydown";
            // };
            // onkeyup = function (e) {
            //     delete keysPressed[e.key];
            // };
        }, canvasRef.current);

        return sketch.remove;
    }, [p5Images, gifFrames]);

    return (
        <div>
            <span>
                <input type="file" onChange={handleFileInputChange} />
            </span>
            <div ref={canvasRef} />
        </div>
    );
}
