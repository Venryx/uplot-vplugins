import { Assert, E, Lerp } from "../Utils/FromJSVE.js";
export class AnnotationsOptions {
    constructor(opts) {
        this.annotations = [];
        Object.assign(this, opts);
    }
}
export function ConvertPosIndicatorToContextPoint(pos, chart, context, defaultScaleKey, defaultFinalize) {
    /*if (typeof pos == "number") {
        pos = {type: "valueOnAxis", axisKey: defaultScaleKey, value: pos};
    } else if (typeof pos == "string") {
        const {left, top, width, height} = chart.bbox;
        const percent = Number(pos.slice(0, -1)) / 100;
        if (defaultScaleKey == "x") {
            pos = {type: "pixelOnCanvas", value: Lerp(left, left + width, percent)};
        } else {
            pos = {type: "pixelOnCanvas", value: Lerp(top + height, top, percent)};
        }
    }*/
    var _a, _b;
    let result;
    if (pos.value != null) {
        result = chart.valToPos(pos.value, (_a = pos.value_axis) !== null && _a !== void 0 ? _a : defaultScaleKey, (_b = pos.value_toCanvasPixels) !== null && _b !== void 0 ? _b : true);
    }
    else if (pos.pixel != null) {
        const { left, top, width, height } = chart.bbox;
        if (typeof pos.pixel == "number") {
            if (defaultScaleKey == "x") {
                result = (pos.pixel_relToFullCanvas ? 0 : left) + pos.pixel;
            }
            else {
                result = (pos.pixel_relToFullCanvas ? 0 : top) + pos.pixel;
            }
        }
        else {
            const percent = Number(pos.pixel.slice(0, -1)) / 100;
            if (defaultScaleKey == "x") {
                result = Lerp(left, left + width, percent);
            }
            else {
                //result = Lerp(top + height, top, percent);
                result = Lerp(top, top + height, percent);
            }
        }
    }
    else {
        Assert(false, `Either "value" or "pixel" field must be supplied for pos/size indicator.`);
    }
    Assert(result != null, `Position/size element cannot be null.`);
    const finalize = pos.finalize !== undefined ? pos.finalize : defaultFinalize;
    if (finalize != null) {
        if (finalize == "floor")
            result = Math.floor(result);
        else if (finalize == "ceiling")
            result = Math.ceil(result);
        else if (finalize == "round")
            result = Math.round(result);
        else
            result = finalize(result);
    }
    Assert(result != null, `Position/size element cannot be null. (after finalization)`);
    return result;
}
export class AnnotationsPlugin {
    constructor(options) {
        this.hooks = {
            drawSeries: (u, seriesIdx) => {
                var _a, _b, _c, _d, _e;
                const opts = this.options;
                const { ctx } = u;
                const { left, top, width, height } = u.bbox;
                ctx.save();
                const shouldRenderInfo = { chart: u };
                for (let entry of opts.annotations) {
                    if (entry.shouldRender && entry.shouldRender(shouldRenderInfo) == false)
                        continue;
                    (_a = entry.preSetup) === null || _a === void 0 ? void 0 : _a.call(entry, { entry, ctx, chart: u });
                    ctx.globalCompositeOperation = (_b = entry.drawType) !== null && _b !== void 0 ? _b : "source-over";
                    if (entry.type == "line") {
                        // add "floor" op to position-indicator (if finalize-op unspecified), to ensure that line stays actually one pixel thick
                        if (entry.x && entry.x.finalize === undefined)
                            entry.x.finalize = a => Math.floor(a);
                        if (entry.y && entry.y.finalize === undefined)
                            entry.y.finalize = a => Math.floor(a);
                        const newEntry = E({
                            type: "box",
                            fillStyle: entry.color,
                        }, entry.x != null && {
                            xMin: entry.x,
                            xSize: { pixel: entry.lineWidth },
                            yMin: { pixel: "0%" },
                            yMax: { pixel: "100%" },
                        }, entry.y != null && {
                            xMin: { pixel: "0%" },
                            xMax: { pixel: "100%" },
                            yMin: entry.y,
                            ySize: { pixel: entry.lineWidth },
                        });
                        entry = newEntry;
                    }
                    ctx.beginPath();
                    ctx.rect(left, top, width, height);
                    ctx.clip(); // make sure we don't draw outside of chart-bounds
                    (_c = entry.preDraw) === null || _c === void 0 ? void 0 : _c.call(// make sure we don't draw outside of chart-bounds
                    entry, { entry, ctx, chart: u });
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
                    else if (entry.type == "text") {
                        const x = ConvertPosIndicatorToContextPoint(entry.x, u, ctx, "x", "round");
                        const y = ConvertPosIndicatorToContextPoint(entry.y, u, ctx, "y", "round");
                        if (entry.fillStyle)
                            ctx.fillStyle = entry.fillStyle;
                        if (entry.strokeStyle)
                            ctx.strokeStyle = entry.strokeStyle;
                        if (entry.lineWidth)
                            ctx.lineWidth = entry.lineWidth;
                        ctx.textAlign = (_d = entry.textAlign) !== null && _d !== void 0 ? _d : "center";
                        if (entry.font)
                            ctx.font = entry.font;
                        ctx.fillText(entry.text, x, y);
                    }
                    (_e = entry.postDraw) === null || _e === void 0 ? void 0 : _e.call(entry, { entry, ctx, chart: u });
                }
                ctx.restore();
            },
        };
        this.options = new AnnotationsOptions(options);
    }
}
