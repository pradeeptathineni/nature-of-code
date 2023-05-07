import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function Rename() {
    const canvasRef = useRef(null);
    let width = window.innerWidth;
    let height = window.innerHeight;

    useEffect(() => {
        const sketch = new p5((p) => {
            p.setup = () => {
                p.createCanvas(width, height);
            };

            p.draw = () => {};

            p.mouseMoved = () => {};
        }, canvasRef.current);

        return sketch.remove;
    }, []);

    function handleKeyPress(e) {
        if (e.key === "w") {
        }
    }

    return <div ref={canvasRef} tabIndex="0" onKeyPress={handleKeyPress} />;
}

const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
