import { Assert, E, IsNaN } from "../Utils/FromJSVE.js";
export class PanAndZoomOptions {
    constructor() {
        this.zoomFactor_x = .75;
        this.zoomFactor_y = .75;
        this.clamp = true;
    }
}
export function PanAndZoomPlugin(opts_partial) {
    const opts = E(new PanAndZoomOptions(), opts_partial);
    /*const xRange = ()=>opts.xMax - opts.xMin;
    const yRange = ()=>opts.yMax - opts.yMin;*/
    const clampRangeX = opts.xMax - opts.xMin;
    const clampRangeY = opts.yMax - opts.yMin;
    function clamp(newRange, newMin, newMax, clampRange, clampMin, clampMax) {
        if (newRange > clampRange) {
            newMin = clampMin;
            newMax = clampMax;
        }
        else if (newMin < clampMin) {
            newMin = clampMin;
            newMax = clampMin + newRange;
        }
        else if (newMax > clampMax) {
            newMax = clampMax;
            newMin = clampMax - newRange;
        }
        return [newMin, newMax];
    }
    return {
        hooks: {
            ready: u => {
                /*xMin = u.scales.x.min;
                xMax = u.scales.x.max;
                yMin = u.scales.y.min;
                yMax = u.scales.y.max;*/
                const plot = u.root.querySelector(".u-over");
                const rect = plot.getBoundingClientRect();
                // wheel drag pan
                plot.addEventListener("mousedown", e => {
                    if (e.button == 1) {
                        //plot.style.cursor = "move";
                        e.preventDefault();
                        const left0 = e.clientX;
                        const top0 = e.clientY;
                        const scXMin0 = u.scales.x.min;
                        const scXMax0 = u.scales.x.max;
                        const scYMin0 = u.scales.y.min;
                        const scYMax0 = u.scales.y.max;
                        const xUnitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x");
                        const yUnitsPerPx = u.posToVal(1, "y") - u.posToVal(0, "y");
                        function onmove(e) {
                            e.preventDefault();
                            const left1 = e.clientX;
                            const top1 = e.clientY;
                            const dx = xUnitsPerPx * (left1 - left0);
                            const dy = yUnitsPerPx * (top1 - top0);
                            let newMinX = scXMin0 - dx;
                            let newMaxX = scXMax0 - dx;
                            let newMinY = scYMin0 - dy;
                            let newMaxY = scYMax0 - dy;
                            if (opts.clamp) {
                                [newMinX, newMaxX] = clamp(newMaxX - newMinX, newMinX, newMaxX, clampRangeX, opts.xMin, opts.xMax);
                                [newMinY, newMaxY] = clamp(newMaxY - newMinY, newMinY, newMaxY, clampRangeY, opts.yMin, opts.yMax);
                                // find more organic way to do this
                                if (opts.zoomFactor_x == 0)
                                    [newMinX, newMaxX] = [opts.xMin, opts.xMax];
                                if (opts.zoomFactor_y == 0)
                                    [newMinY, newMaxY] = [opts.yMin, opts.yMax];
                            }
                            Assert([newMinX, newMaxX, newMinY, newMaxY].every(a => !IsNaN(a)), "Found NaN in new scale values.");
                            u.batch(() => {
                                u.setScale("x", { min: newMinX, max: newMaxX });
                                u.setScale("y", { min: newMinY, max: newMaxY });
                            });
                        }
                        function onup(e) {
                            document.removeEventListener("mousemove", onmove);
                            document.removeEventListener("mouseup", onup);
                        }
                        document.addEventListener("mousemove", onmove);
                        document.addEventListener("mouseup", onup);
                    }
                });
                // wheel scroll zoom
                plot.addEventListener("wheel", e => {
                    var _a, _b;
                    e.preventDefault();
                    const { left, top } = u.cursor;
                    const leftPct = left / rect.width;
                    const btmPct = 1 - top / rect.height;
                    const xVal = u.posToVal(left, "x");
                    const yVal = u.posToVal(top, "y");
                    const oxRange = u.scales.x.max - u.scales.x.min;
                    const oyRange = u.scales.y.max - u.scales.y.min;
                    let nxRange = oxRange;
                    let nyRange = oyRange;
                    // zooming in
                    if (e.deltaY < 0) {
                        nxRange = oxRange * opts.zoomFactor_x;
                        nyRange = oyRange * opts.zoomFactor_y;
                    }
                    // zooming out
                    else {
                        // find more organic way to do the max-range checks
                        if (oxRange < ((_a = opts.xRangeMax) !== null && _a !== void 0 ? _a : 0))
                            nxRange = oxRange / opts.zoomFactor_x;
                        if (oyRange < ((_b = opts.yRangeMax) !== null && _b !== void 0 ? _b : 0))
                            nyRange = oyRange / opts.zoomFactor_y;
                    }
                    let newMinX = xVal - leftPct * nxRange;
                    let newMaxX = newMinX + nxRange;
                    let newMinY = yVal - btmPct * nyRange;
                    let newMaxY = newMinY + nyRange;
                    if (opts.clamp) {
                        [newMinX, newMaxX] = clamp(nxRange, newMinX, newMaxX, clampRangeX, opts.xMin, opts.xMax);
                        [newMinY, newMaxY] = clamp(nyRange, newMinY, newMaxY, clampRangeY, opts.yMin, opts.yMax);
                        // find more organic way to do this
                        if (opts.xRangeMax && newMaxX - newMinX > opts.xRangeMax) {
                            const center = (newMinX + newMaxX) / 2;
                            newMinX = center - (opts.xRangeMax / 2);
                            newMaxX = center + (opts.xRangeMax / 2);
                        }
                        if (opts.yRangeMax && newMaxY - newMinY > opts.yRangeMax) {
                            const center = (newMinY + newMaxY) / 2;
                            newMinY = center - (opts.yRangeMax / 2);
                            newMaxY = center + (opts.yRangeMax / 2);
                        }
                        // find more organic way to do this
                        if (opts.zoomFactor_x == 0)
                            [newMinX, newMaxX] = [opts.xMin, opts.xMax];
                        if (opts.zoomFactor_y == 0)
                            [newMinY, newMaxY] = [opts.yMin, opts.yMax];
                    }
                    Assert([newMinX, newMaxX, newMinY, newMaxY].every(a => !IsNaN(a)), "Found NaN in new scale values.");
                    u.batch(() => {
                        u.setScale("x", { min: newMinX, max: newMaxX });
                        u.setScale("y", { min: newMinY, max: newMaxY });
                    });
                });
            },
        },
    };
}
