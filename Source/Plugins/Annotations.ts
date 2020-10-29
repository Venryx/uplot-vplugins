import uPlot from "uplot";
import {Assert, E, IsNaN} from "../Utils/FromJSVE";

export type PositionIndicatorObj = {
	type: "valueOnAxis";
	axisKey: string;
	value: number;
	/** See uplot.valToPos for info. */
	canvasPixels?: boolean;
} | {
	type: "pixelOnCanvas";
	value: number;
};
export type PositionIndicator = number | "min" | "max" | PositionIndicatorObj;
export type SizeIndicator = PositionIndicator; // they're compatible

//export type AnnotationType = "box"
export type Annotation = {
	fillStyle: typeof CanvasRenderingContext2D.prototype.fillStyle;
	strokeStyle: typeof CanvasRenderingContext2D.prototype.strokeStyle;
	lineWidth: number;
} & (
	{
		type: "box";
		xMin?: PositionIndicator;
		xMax?: PositionIndicator;
		xSize?: SizeIndicator;
		yMin?: PositionIndicator;
		yMax?: PositionIndicator;
		ySize?: SizeIndicator;
	}
	| {
		type: "line";
		x?: PositionIndicator;
		y?: PositionIndicator;
	}
);

type Options_OptionalForInitOnly = any;
export type AnnotationsOptions_ForInit = Omit<AnnotationsOptions, Options_OptionalForInitOnly> & Partial<Pick<AnnotationsOptions, Options_OptionalForInitOnly>>;
export class AnnotationsOptions {
	annotations: Annotation[];
}

export function ConvertPositionIndicatorToContextPoint(pos: PositionIndicator, chart: uPlot, context: CanvasRenderingContext2D, defaultScaleKey: "x" | "y") {
	if (typeof pos == "number") {
		pos = {type: "valueOnAxis", axisKey: defaultScaleKey, value: pos};
	} else if (typeof pos == "string") {
		const {left, top, width, height} = chart.bbox;
		if (defaultScaleKey == "x") {
			pos = {type: "pixelOnCanvas", value: pos == "min" ? left : left + width};
		} else {
			pos = {type: "pixelOnCanvas", value: pos == "min" ? top : top + height};
		}
	}

	if (pos.type == "valueOnAxis") {
		return chart.valToPos(pos.value, "x", pos.canvasPixels ?? true);
	}
	if (pos.type == "pixelOnCanvas") {
		return pos.value;
	}
	Assert(false, `Invalid position-indicator type (${pos["type"]}).`);
}

export function AnnotationsPlugin(opts: AnnotationsOptions) {
	opts = E(new AnnotationsOptions(), opts);

	return {
		hooks: {
			drawSeries(u, i) {
				const {ctx} = u;
				const {left, top, width, height} = u.bbox;
				ctx.save();

				for (let entry of opts.annotations) {
					if (entry.type == "line") {
						const newEntry: Annotation = E(
							entry,
							{type: "box", x: null, y: null},
							entry.x != null && {
								xMin: entry.x,
								xSize: {type: "pixelOnCanvas", value: entry.lineWidth},
								yMin: "min",
								yMax: "max",
							},
							entry.y != null && {
								xMin: "min",
								xMax: "max",
								yMin: entry.y,
								ySize: {type: "pixelOnCanvas", value: entry.lineWidth},
							},
						);
						entry = newEntry;
					}

					ctx.strokeStyle = entry.strokeStyle;
					ctx.fillStyle = entry.fillStyle;
					ctx.lineWidth = entry.lineWidth;

					if (entry.type == "box") {
						ctx.beginPath();
						ctx.rect(left, top, width, height);
						ctx.clip(); // make sure we don't draw outside of chart-bounds

						function FillMinMaxAndSizeFrom2(vals: (number|null|undefined)[]) {
							return vals.map((val, i): number=>{
								if (val) return val;
								if (i == 0) return vals[1]! - vals[2]!;
								if (i == 1) return vals[0]! + vals[2]!;
								/*if (i == 2)*/
								Assert(i == 2);
								return vals[1]! - vals[0]!;
							});
						}

						const xVals = [entry.xMin, entry.xMax, entry.xSize];
						Assert(xVals.filter(a=>a != null).length == 2, "Exactly two of these should be specified: xMin, xMax, xSize");
						const xVals_ctx = xVals.map(val=>(val ? ConvertPositionIndicatorToContextPoint(val, u, ctx, "x") : null));
						const xVals_ctx_final = FillMinMaxAndSizeFrom2(xVals_ctx);

						const yVals = [entry.yMin, entry.yMax, entry.ySize];
						Assert(yVals.filter(a=>a != null).length == 2, "Exactly two of these should be specified: yMin, yMax, ySize");
						const yVals_ctx = yVals.map(val=>(val ? ConvertPositionIndicatorToContextPoint(val, u, ctx, "y") : null));
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
		} as uPlot.PluginHooks,
	};
}