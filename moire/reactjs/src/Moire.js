import React, { useState, useRef, useEffect } from "react";
import p5 from "p5";
import { parseGIF, decompressFrames } from "gifuct-js";

export default function Moire() {
    const canvasRef = useRef(null);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let cursor = "default";

    let selectedFile;
    const [fileType, setFileType] = useState(null);
    const [fileData, setFileData] = useState(null);

    let img;
    let weavedImage;
    let p5Images = [];

    let scaleRatio = 1;

    const [gif, setGif] = useState(null);
    const [video, setVideo] = useState(null);
    const [frames, setFrames] = useState([]);
    let currentFrameIndex = 0;
    let totalDelay = 0;

    let frameThickness = 1;
    let maxFrames = 8;
    let frameRate = 20;

    let staticGrid, moveGrid;
    let gridMoveSpeed = frameThickness;
    let gridLineWidth = 20;
    let gridLineSpacing = 20;
    let gridOpacity = 230;

    function handleFileInputChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const { type } = file;
        setFileType(type);
        console.log("File Type:", type);

        let reader = new FileReader();
        if (type === "image/png" || type === "image/jpeg") {
            reader.onload = (event) => {
                setFileData(event.target.result);
            };
            reader.readAsDataURL(file);
        } else if (type === "image/gif") {
            reader.onload = (event) => {
                const buffer = event.target.result;
                let gif = parseGIF(buffer);
                let gifFrames = decompressFrames(gif, { withAlpha: true });

                const numFrames = gifFrames.length;
                if (numFrames > maxFrames) {
                    let tempArr = [];
                    let div = Math.ceil(numFrames / maxFrames);
                    for (let i = 0; i < numFrames; i += div) {
                        tempArr.push(gifFrames[i]);
                    }
                    gifFrames = tempArr;
                }

                setFrames(gifFrames);
                setGif(gif);
            };
            reader.readAsArrayBuffer(file);
        } else if (type === "video/mp4" || type === "video/quicktime") {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.crossOrigin = "anonymous";

            video.addEventListener("loadedmetadata", () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const context = canvas.getContext("2d");

                let videoFrames = [];
                const extractFrame = () => {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const frame = new Uint8ClampedArray(imageData.data);

                    videoFrames.push(frame);

                    if (video.currentTime < video.duration) {
                        requestAnimationFrame(extractFrame);
                    } else {
                        const numFrames = videoFrames.length;
                        if (numFrames > maxFrames) {
                            console.log("hello");
                            let tempArr = [];
                            let div = Math.ceil(numFrames / maxFrames);
                            for (let i = 0; i < numFrames; i += div) {
                                tempArr.push(videoFrames[i]);
                            }
                            videoFrames = tempArr;
                        }

                        setFrames(videoFrames);
                        setVideo(video);

                        URL.revokeObjectURL(video.src);
                        video.remove();
                    }
                };

                video.play();
                extractFrame();
            });
        } else {
            console.log("Unsupported file type.");
        }
    }

    useEffect(() => {
        const sketch = new p5((p) => {
            p.preload = () => {
                console.log("File Type:", fileType);
                if (fileType === "image/png" || fileType === "image/jpeg") {
                    if (fileData) {
                        let p5Image = p.loadImage(
                            fileData,
                            (e) => {
                                console.log(`${fileType} load succeeded`);
                            },
                            (e) => {
                                console.log(`${fileType} load failed:`, e);
                            }
                        );
                        p5Images.push(new P5Image(p5Image, 0, 0));
                    }
                } else if (fileType === "image/gif") {
                } else if (fileType === "video/mp4") {
                }
                console.log("preloaded");
            };
            p.setup = () => {
                p.createCanvas(width, height);
                p.noSmooth();
                p.angleMode(p.DEGREES);
                p.frameRate(frameRate);
                if (fileType) {
                    if (fileType === "image/png") {
                    } else if (fileType === "image/jpeg") {
                    } else if (fileType === "image/gif") {
                        const numFrames = frames.length;
                        if (gif && numFrames > 0) {
                            console.log(frames);
                            let gifW = gif.lsd.width;
                            let gifH = gif.lsd.height;
                            weavedImage = p.createImage(gifW, gifH);
                            weavedImage.width = gifW;
                            weavedImage.height = gifH;

                            let frameNumber = 0;
                            let frameThicknessCopy = frameThickness;
                            weavedImage.loadPixels();
                            for (let x = 0; x < gifW; x++) {
                                for (let y = 0; y < gifH; y++) {
                                    const pixelIndex = (y * gifW + x) * 4;
                                    const data = frames[frameNumber].patch;

                                    weavedImage.pixels[pixelIndex] = data[pixelIndex];
                                    weavedImage.pixels[pixelIndex + 1] = data[pixelIndex + 1];
                                    weavedImage.pixels[pixelIndex + 2] = data[pixelIndex + 2];
                                    weavedImage.pixels[pixelIndex + 3] = data[pixelIndex + 3];
                                }
                                if (--frameThicknessCopy <= 0) {
                                    if (++frameNumber >= numFrames) {
                                        frameNumber = 0;
                                    }
                                    frameThicknessCopy = frameThickness;
                                }
                            }
                            weavedImage.updatePixels();
                            scaleRatio = Math.min(width / weavedImage.width, height / weavedImage.height);
                            weavedImage.width *= scaleRatio;
                            weavedImage.height *= scaleRatio;
                        }
                        moveGrid = new Grid(
                            0,
                            0,
                            200,
                            400,
                            (frames.length - 1) * frameThickness,
                            1,
                            frameThickness,
                            1,
                            true,
                            false
                        );
                    } else if (fileType === "video/mp4") {
                        const numFrames = frames.length;
                        if (video && numFrames > 0) {
                            console.log(frames);
                            let vidW = video.videoWidth;
                            let vidH = video.videoHeight;
                            weavedImage = p.createImage(vidW, vidH);
                            weavedImage.width = vidW;
                            weavedImage.height = vidH;

                            let frameNumber = 0;
                            let frameThicknessCopy = frameThickness;
                            weavedImage.loadPixels();
                            for (let x = 0; x < vidW; x++) {
                                for (let y = 0; y < vidH; y++) {
                                    const pixelIndex = (y * vidW + x) * 4;
                                    const data = frames[frameNumber];

                                    weavedImage.pixels[pixelIndex] = data[pixelIndex];
                                    weavedImage.pixels[pixelIndex + 1] = data[pixelIndex + 1];
                                    weavedImage.pixels[pixelIndex + 2] = data[pixelIndex + 2];
                                    weavedImage.pixels[pixelIndex + 3] = data[pixelIndex + 3];
                                }
                                if (--frameThicknessCopy <= 0) {
                                    if (++frameNumber >= numFrames) {
                                        frameNumber = 0;
                                    }
                                    frameThicknessCopy = frameThickness;
                                }
                            }
                            weavedImage.updatePixels();
                            scaleRatio = Math.min(width / weavedImage.width, height / weavedImage.height);
                            weavedImage.width *= scaleRatio;
                            weavedImage.height *= scaleRatio;
                            console.log(weavedImage);
                        }
                        moveGrid = new Grid(
                            0,
                            0,
                            200,
                            400,
                            (frames.length - 1) * frameThickness,
                            1,
                            frameThickness,
                            1,
                            true,
                            false
                        );
                    }
                }
                console.log("setuped");
            };

            p.draw = () => {
                p.background(255);
                p.stroke(0);
                p.fill(0, 0, 0, gridOpacity);
                p.cursor(cursor);

                if (fileType === "image/png" || fileType === "image/jpeg") {
                    drawImage(p5Images[0]);
                } else if (fileType === "image/gif") {
                    if (weavedImage) {
                        p.image(weavedImage, 0, 0);
                    }
                    if (frames.length > 0) {
                        const currentFrame = frames[currentFrameIndex];
                        const delay = currentFrame.delay;

                        totalDelay += p.deltaTime;
                        if (totalDelay >= delay) {
                            totalDelay = 0;
                            currentFrameIndex = (currentFrameIndex + 1) % frames.length;
                        }

                        moveGrid.rotation();
                        moveGrid.scaling();
                        moveGrid.toggleControl();
                        moveGrid.moveWithWASD();
                        moveGrid.moveWithMouse();
                        moveGrid.draw();
                    }
                } else if (fileType === "video/mp4") {
                    if (weavedImage) {
                        p.image(weavedImage, 0, 0);
                    }
                    moveGrid.rotation();
                    moveGrid.scaling();
                    moveGrid.toggleControl();
                    moveGrid.moveWithWASD();
                    moveGrid.moveWithMouse();
                    moveGrid.draw();
                }
            };

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
                                    (p.pixels[index] + p.pixels[index + 1] + p.pixels[index + 2]) / 3
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
                    let scaleRatio = width / p5Image.data.width;
                    p5Image.data.width *= scaleRatio;
                    p5Image.data.height *= scaleRatio;
                    let w = p5Image.data.width;
                    let h = p5Image.data.height;
                    p5Image.move();
                    p5Image.draw();
                    alterImagePixels(w, h, "bw");
                }
            }

            function P5Image(data, x, y) {
                this.data = data;
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

                this.draw = function () {
                    p.image(this.data, this.x, this.y, this.data.width, this.data.height);
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
                    p.rect(imgX - cornerSize / 2, imgY - cornerSize / 2, cornerSize, cornerSize);
                    // Top right corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(imgX + w - cornerSize / 2, imgY - cornerSize / 2, cornerSize, cornerSize);
                    // Bottom left corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(imgX - cornerSize / 2, imgY + h - cornerSize / 2, cornerSize, cornerSize);
                    // Bottom right corner
                    p.fill(255);
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.rect(imgX + w - cornerSize / 2, imgY + h - cornerSize / 2, cornerSize, cornerSize);
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
                        if (this.lastMouseResizePosX && this.lastMouseResizePosY) {
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
                drawHorizontals = true,
                validControls = ["mouse", "wasd"]
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
                this.scale = p.createVector(scaleRatio, scaleRatio);
                this.validControls = validControls;
                this.currentControl = "mouse";

                this.toggleControl = function () {
                    p.keyReleased = () => {
                        if (p.key === "z") {
                            let nextControl =
                                (this.validControls.indexOf(this.currentControl) + 1) % this.validControls.length;
                            this.currentControl = this.validControls[nextControl];
                        } else if (p.key === "x") {
                            let nextControl =
                                (this.validControls.indexOf(this.currentControl) + -1) % this.validControls.length;
                            this.currentControl = this.validControls[nextControl];
                        }
                    };
                };

                this.moveWithMouse = function () {
                    if (this.currentControl === "mouse") {
                        this.x = p.mouseX - this.middleX;
                        this.y = p.mouseY - this.underneath;
                    }
                };

                this.moveWithWASD = function () {
                    if (p.keyIsDown(65)) this.x -= gridMoveSpeed;
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

                this.draw = function () {
                    p.noStroke();
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
    }, [frames]);

    return (
        <div>
            <span>
                <input type="file" onChange={handleFileInputChange} />
            </span>
            <div ref={canvasRef} />
            <video id="video-player" controls style={{ display: "none" }}></video>
        </div>
    );
}
