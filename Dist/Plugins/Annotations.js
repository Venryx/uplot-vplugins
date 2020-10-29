import { Assert, E } from "../Utils/FromJSVE";
export class AnnotationsOptions {
}
export function ConvertPositionIndicatorToContextPoint(pos, chart, context, defaultScaleKey) {
    var _a;
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
    if (pos.type == "valueOnAxis") {
        return chart.valToPos(pos.value, "x", (_a = pos.canvasPixels) !== null && _a !== void 0 ? _a : true);
    }
    if (pos.type == "pixelOnCanvas") {
        return pos.value;
    }
    Assert(false, `Invalid position-indicator type (${pos["type"]}).`);
}
export function AnnotationsPlugin(opts) {
    opts = E(new AnnotationsOptions(), opts);
    return {
        hooks: {
            drawSeries(u, i) {
                const { ctx } = u;
                const { left, top, width, height } = u.bbox;
                ctx.save();
                for (let entry of opts.annotations) {
                    if (entry.type == "line") {
                        const newEntry = E(entry, { type: "box", x: null, y: null }, entry.x != null && {
                            xMin: entry.x,
                            xSize: { type: "pixelOnCanvas", value: entry.lineWidth },
                            yMin: "min",
                            yMax: "max",
                        }, entry.y != null && {
                            xMin: "min",
                            xMax: "max",
                            yMin: entry.y,
                            ySize: { type: "pixelOnCanvas", value: entry.lineWidth },
                        });
                        entry = newEntry;
                    }
                    ctx.strokeStyle = entry.strokeStyle;
                    ctx.fillStyle = entry.fillStyle;
                    ctx.lineWidth = entry.lineWidth;
                    if (entry.type == "box") {
                        ctx.beginPath();
                        ctx.rect(left, top, width, height);
                        ctx.clip(); // make sure we don't draw outside of chart-bounds
                        function FillMinMaxAndSizeFrom2(vals) {
                            return vals.map((val, i) => {
                                if (val)
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
                        const xVals = [entry.xMin, entry.xMax, entry.xSize];
                        Assert(xVals.filter(a => a != null).length == 2, "Exactly two of these should be specified: xMin, xMax, xSize");
                        const xVals_ctx = xVals.map(val => (val ? ConvertPositionIndicatorToContextPoint(val, u, ctx, "x") : null));
                        const xVals_ctx_final = FillMinMaxAndSizeFrom2(xVals_ctx);
                        const yVals = [entry.yMin, entry.yMax, entry.ySize];
                        Assert(yVals.filter(a => a != null).length == 2, "Exactly two of these should be specified: yMin, yMax, ySize");
                        const yVals_ctx = yVals.map(val => (val ? ConvertPositionIndicatorToContextPoint(val, u, ctx, "y") : null));
                        const yVals_ctx_final = FillMinMaxAndSizeFrom2(yVals_ctx);
                        ctx.fillRect(xVals_ctx_final[0], yVals_ctx_final[0], xVals_ctx_final[2], yVals_ctx_final[2]);
                    } /*else if (entry.type == "line") {
                        ctx.beginPath();
                        ctx.rect(left, top, width, height);
                        ctx.clip(); // make sure we don't draw outside of chart-bounds

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
