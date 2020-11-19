import { Assert, E } from "../Utils/FromJSVE";
export class AnnotationsOptions {
}
export function ConvertPosIndicatorToContextPoint(pos, chart, context, defaultScaleKey, defaultFinalize) {
    var _a, _b;
    if (typeof pos == "number") {
        pos = { type: "valueOnAxis", axisKey: defaultScaleKey, value: pos };
    }
    else if (typeof pos == "string") {
        const { left, top, width, height } = chart.bbox;
        if (defaultScaleKey == "x") {
            pos = { type: "pixelOnCanvas", value: pos == "min" ? left : left + width };
        }
        else {
            pos = { type: "pixelOnCanvas", value: pos == "min" ? top : top + height };
        }
    }
    let result;
    if (pos.type == "valueOnAxis") {
        result = chart.valToPos(pos.value, (_a = pos.axisKey) !== null && _a !== void 0 ? _a : defaultScaleKey, (_b = pos.canvasPixels) !== null && _b !== void 0 ? _b : true);
    }
    if (pos.type == "pixelOnCanvas") {
        result = pos.value;
    }
    Assert(result != null, `Position/size element cannot be null.`);
    const finalize = pos.finalize !== undefined ? pos.finalize : defaultFinalize;
    if (pos.finalize != null) {
        if (pos.finalize == "floor")
            result = Math.floor(result);
        else if (pos.finalize == "ceiling")
            result = Math.ceil(result);
        else if (pos.finalize == "round")
            result = Math.round(result);
        else
            result = pos.finalize(result);
    }
    Assert(result != null, `Position/size element cannot be null. (after finalization)`);
    return result;
}
export function AnnotationsPlugin(opts) {
    opts = E(new AnnotationsOptions(), opts);
    return {
        hooks: {
            drawSeries(u, i) {
                var _a;
                const { ctx } = u;
                const { left, top, width, height } = u.bbox;
                ctx.save();
                for (let entry of opts.annotations) {
                    ctx.globalCompositeOperation = (_a = entry.drawType) !== null && _a !== void 0 ? _a : "source-over";
                    if (entry.type == "line") {
                        const newEntry = E({
                            type: "box",
                            fillStyle: entry.color,
                        }, entry.x != null && {
                            //xMin: entry.x,
                            xMin: typeof entry.x == "number"
                                ? { type: "valueOnAxis", axisKey: "x", value: entry.x, finalize: a => Math.floor(a) } // floor, to ensure that line stays actually one pixel thick
                                : entry.x,
                            xSize: { type: "pixelOnCanvas", value: entry.lineWidth },
                            yMin: "min",
                            yMax: "max",
                        }, entry.y != null && {
                            xMin: "min",
                            xMax: "max",
                            //yMin: entry.y,
                            yMin: typeof entry.y == "number"
                                ? { type: "valueOnAxis", axisKey: "y", value: entry.y, finalize: a => Math.floor(a) } // floor, to ensure that line stays actually one pixel thick
                                : entry.y,
                            ySize: { type: "pixelOnCanvas", value: entry.lineWidth },
                        });
                        entry = newEntry;
                    }
                    ctx.beginPath();
                    ctx.rect(left, top, width, height);
                    ctx.clip(); // make sure we don't draw outside of chart-bounds
                    if (entry.type == "box") {
                        ctx.fillStyle = entry.fillStyle;
                        function FillMinMaxAndSizeFrom2(vals) {
                            return vals.map((val, i) => {
                                if (val != null)
                                    return val;
                                if (i == 0)
                                    return vals[1] - vals[2];
                                if (i == 1)
                                    return vals[0] + vals[2];
                                /*if (i == 2)*/
                                Assert(i == 2);
                                return vals[1] - vals[0];
                            });
                        }
                        //const indexToType = ["min", "max", "size"];
                        const indexToDefaultFinalize = ["floor", "ceiling", "ceiling"];
                        const xVals = [entry.xMin, entry.xMax, entry.xSize];
                        Assert(xVals.filter(a => a != null).length == 2, "Exactly two of these should be specified: xMin, xMax, xSize");
                        const xVals_ctx = xVals.map((val, i) => (val != null ? ConvertPosIndicatorToContextPoint(val, u, ctx, "x", indexToDefaultFinalize[i]) : null));
                        const xVals_ctx_final = FillMinMaxAndSizeFrom2(xVals_ctx);
                        const yVals = [entry.yMin, entry.yMax, entry.ySize];
                        Assert(yVals.filter(a => a != null).length == 2, "Exactly two of these should be specified: yMin, yMax, ySize");
                        const yVals_ctx = yVals.map((val, i) => (val != null ? ConvertPosIndicatorToContextPoint(val, u, ctx, "y", indexToDefaultFinalize[i]) : null));
                        const yVals_ctx_final = FillMinMaxAndSizeFrom2(yVals_ctx);
                        ctx.fillRect(xVals_ctx_final[0], yVals_ctx_final[0], xVals_ctx_final[2], yVals_ctx_final[2]);
                        if (entry.lineWidth > 0) {
                            ctx.strokeStyle = entry.strokeStyle;
                            ctx.lineWidth = entry.lineWidth;
                            ctx.rect(xVals_ctx_final[0], yVals_ctx_final[0], xVals_ctx_final[2], yVals_ctx_final[2]);
                        }
                    } /*else if (entry.type == "line") {
                        ctx.strokeStyle = entry.strokeStyle;
                        ctx.lineWidth = entry.lineWidth;

                        ctx.beginPath();
                        ctx.moveTo(cx, top);
                        ctx.lineTo(cx, height);
                        ctx.closePath();
                        ctx.stroke();
                    }*/
                }
                ctx.restore();
            },
        },
    };
}
