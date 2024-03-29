import uPlot from "uplot";
import {Assert, E, IsNaN, Lerp} from "../Utils/FromJSVE.js";

/** Mark some properties which only the former including as optional and set the value to never */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
/** get the XOR type which could make 2 types exclude each other */
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type FinalizeOp = "floor" | "ceiling" | "round" | ((val: number)=>number) | null;
export type PositionIndicator = XOR<{
	//type: "valueOnAxis";
	//value: number | string;
	value: number;
	value_axis?: string;
	/** See uplot.valToPos for info. */
	value_toCanvasPixels?: boolean;

	finalize?: FinalizeOp;
}, {
	//type: "pixelOnCanvas";
	pixel: number | string;

	finalize?: FinalizeOp;
}>;
export type SizeIndicator = PositionIndicator; // they're compatible

/** See details here: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation */
export type DrawType =
	"source-over" |
	"source-in" |
	"source-out" |
	"source-atop" |
	"destination-over" |
	"destination-in" |
	"destination-out" |
	"destination-atop" |
	"lighter" |
	"copy" |
	"xor" |
	"multiply" |
	"screen" |
	"overlay" |
	"darken" |
	"lighten" |
	"color-dodge" |
	"color-burn" |
	"hard-light" |
	"soft-light" |
	"difference" |
	"exclusion" |
	"hue" |
	"saturation" |
	"color" |
	"luminosity";

//export type AnnotationType = "box"
export type Annotation = {
	drawType?: DrawType;
	shouldRender?: (info: {chart: uPlot})=>boolean;
} & (
	XOR<{
		type: "box";
		xMin?: PositionIndicator;
		xMax?: PositionIndicator;
		xSize?: SizeIndicator;
		yMin?: PositionIndicator;
		yMax?: PositionIndicator;
		ySize?: SizeIndicator;
		fillStyle: typeof CanvasRenderingContext2D.prototype.fillStyle;
		strokeStyle?: typeof CanvasRenderingContext2D.prototype.strokeStyle;
		lineWidth?: number;
	}, {
		type: "line";
		x?: PositionIndicator;
		y?: PositionIndicator;
		color: typeof CanvasRenderingContext2D.prototype.fillStyle;
		//width: number;
		lineWidth: number; // reuse prop-names where possible
	}>
);

type Options_OptionalForInitOnly = any;
export type AnnotationsOptions_ForInit = Omit<AnnotationsOptions, Options_OptionalForInitOnly> & Partial<Pick<AnnotationsOptions, Options_OptionalForInitOnly>>;
export class AnnotationsOptions {
	annotations: Annotation[];
}

export function ConvertPosIndicatorToContextPoint(pos: PositionIndicator, chart: uPlot, context: CanvasRenderingContext2D, defaultScaleKey: "x" | "y", defaultFinalize: FinalizeOp) {
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

	let result: number|undefined;
	if (pos.value != null) {
		result = chart.valToPos(pos.value, pos.value_axis ?? defaultScaleKey, pos.value_toCanvasPixels ?? true);
	} else if (pos.pixel != null) {
		if (typeof pos.pixel == "number") {
			result = pos.pixel;
		} else {
			const {left, top, width, height} = chart.bbox;
			const percent = Number(pos.pixel.slice(0, -1)) / 100;
			if (defaultScaleKey == "x") {
				result = Lerp(left, left + width, percent);
			} else {
				//result = Lerp(top + height, top, percent);
				result = Lerp(top, top + height, percent);
			}
		}
	} else {
		Assert(false, `Either "value" or "pixel" field must be supplied for pos/size indicator.`);
	}
	Assert(result != null, `Position/size element cannot be null.`);

	const finalize = pos.finalize !== undefined ? pos.finalize : defaultFinalize;
	if (finalize != null) {
		if (finalize == "floor") result = Math.floor(result);
		else if (finalize == "ceiling") result = Math.ceil(result);
		else if (finalize == "round") result = Math.round(result);
		else result = finalize(result);
	}

	Assert(result != null, `Position/size element cannot be null. (after finalization)`);
	return result;
}

export function AnnotationsPlugin(opts: AnnotationsOptions) {
	opts = E(new AnnotationsOptions(), opts);

	return {
		hooks: {
			drawSeries(u, i) {
				const {ctx} = u;
				const {left, top, width, height} = u.bbox;
				ctx.save();

				const shouldRenderInfo = {chart: u};
				for (let entry of opts.annotations) {
					if (entry.shouldRender && entry.shouldRender(shouldRenderInfo) == false) continue;

					ctx.globalCompositeOperation = entry.drawType ?? "source-over";
					if (entry.type == "line") {
						// add "floor" op to position-indicator (if finalize-op unspecified), to ensure that line stays actually one pixel thick
						if (entry.x && entry.x.finalize === undefined) entry.x.finalize = a=>Math.floor(a);
						if (entry.y && entry.y.finalize === undefined) entry.y.finalize = a=>Math.floor(a);

						const newEntry: Annotation = E(
							{
								type: "box",
								fillStyle: entry.color,
							} as const,
							entry.x != null && {
								xMin: entry.x,
								xSize: {pixel: entry.lineWidth},
								yMin: {pixel: "0%"},
								yMax: {pixel: "100%"},
							} as const,
							entry.y != null && {
								xMin: {pixel: "0%"},
								xMax: {pixel: "100%"},
								yMin: entry.y,
								ySize: {pixel: entry.lineWidth},
							} as const,
						);
						entry = newEntry;
					}

					ctx.beginPath();
					ctx.rect(left, top, width, height);
					ctx.clip(); // make sure we don't draw outside of chart-bounds

					if (entry.type == "box") {
						ctx.fillStyle = entry.fillStyle;

						function FillMinMaxAndSizeFrom2(vals: (number|null|undefined)[]) {
							return vals.map((val, i): number=>{
								if (val != null) return val;
								if (i == 0) return vals[1]! - vals[2]!;
								if (i == 1) return vals[0]! + vals[2]!;
								/*if (i == 2)*/
								Assert(i == 2);
								return vals[1]! - vals[0]!;
							});
						}

						//const indexToType = ["min", "max", "size"];
						const indexToDefaultFinalize = ["floor", "ceiling", "ceiling"] as const;
						const xVals = [entry.xMin, entry.xMax, entry.xSize];
						Assert(xVals.filter(a=>a != null).length == 2, "Exactly two of these should be specified: xMin, xMax, xSize");
						const xVals_ctx = xVals.map((val, i)=>(val != null ? ConvertPosIndicatorToContextPoint(val, u, ctx, "x", indexToDefaultFinalize[i]) : null));
						const xVals_ctx_final = FillMinMaxAndSizeFrom2(xVals_ctx);

						const yVals = [entry.yMin, entry.yMax, entry.ySize];
						Assert(yVals.filter(a=>a != null).length == 2, "Exactly two of these should be specified: yMin, yMax, ySize");
						const yVals_ctx = yVals.map((val, i)=>(val != null ? ConvertPosIndicatorToContextPoint(val, u, ctx, "y", indexToDefaultFinalize[i]) : null));
						const yVals_ctx_final = FillMinMaxAndSizeFrom2(yVals_ctx);

						ctx.fillRect(xVals_ctx_final[0], yVals_ctx_final[0], xVals_ctx_final[2], yVals_ctx_final[2]);

						if (entry.lineWidth! > 0) {
							ctx.strokeStyle = entry.strokeStyle!;
							ctx.lineWidth = entry.lineWidth!;
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
	} as uPlot.Plugin;
}