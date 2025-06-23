import uPlot from "uplot";
import {Assert, E, IsNaN} from "../Utils/FromJSVE.js";

type Options_OptionalForInitOnly = "zoomFactor_x" | "zoomFactor_y" | "clamp";
export type PanAndZoomOptions_ForInit = Omit<PanAndZoomOptions, Options_OptionalForInitOnly> & Partial<Pick<PanAndZoomOptions, Options_OptionalForInitOnly>>;
export class PanAndZoomOptions {
	constructor(data?: Partial<PanAndZoomOptions>) { Object.assign(this, data); }
	zoomFactor_x = .75;
	zoomFactor_y = .75;
	clamp = true;
	xMin: number;
	xMax: number;
	xRangeMax?: number;
	yMin: number;
	yMax: number;
	yRangeMax?: number;
}

function clamp(newRange: number, newMin: number, newMax: number, clampRange: number, clampMin: number, clampMax: number): [number, number] {
	if (newRange > clampRange) {
		newMin = clampMin;
		newMax = clampMax;
	} else if (newMin < clampMin) {
		newMin = clampMin;
		newMax = clampMin + newRange;
	} else if (newMax > clampMax) {
		newMax = clampMax;
		newMin = clampMax - newRange;
	}

	return [newMin, newMax];
}

export class PanAndZoomPlugin implements uPlot.Plugin {
	constructor(options: ConstructorParameters<typeof PanAndZoomOptions>[0]) {
		this.options = new PanAndZoomOptions(options);
		this.clampRangeX = this.options.xMax - this.options.xMin;
		this.clampRangeY = this.options.yMax - this.options.yMin;
	}

	options: PanAndZoomOptions;
	clampRangeX: number;
	clampRangeY: number;

	hooks = {
		ready: (u: uPlot)=>{
			const opt = this.options;
			const plot = u.root.querySelector(".u-over") as HTMLElement;
			const rect = plot.getBoundingClientRect();

			// wheel drag pan
			plot.addEventListener("mousedown", e=>{
				if (e.button == 1) {
					e.preventDefault();

					const left0 = e.clientX;
					const top0 = e.clientY;

					const scXMin0 = u.scales.x.min!;
					const scXMax0 = u.scales.x.max!;
					const scYMin0 = u.scales.y.min!;
					const scYMax0 = u.scales.y.max!;

					const xUnitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x");
					const yUnitsPerPx = u.posToVal(1, "y") - u.posToVal(0, "y");

					const onmove = (e: MouseEvent)=>{
						e.preventDefault();

						const left1 = e.clientX;
						const top1 = e.clientY;

						const dx = xUnitsPerPx * (left1 - left0);
						const dy = yUnitsPerPx * (top1 - top0);

						let newMinX = scXMin0 - dx;
						let newMaxX = scXMax0 - dx;
						let newMinY = scYMin0 - dy;
						let newMaxY = scYMax0 - dy;
						if (opt.clamp) {
							[newMinX, newMaxX] = clamp(newMaxX - newMinX, newMinX, newMaxX, this.clampRangeX, opt.xMin, opt.xMax);
							[newMinY, newMaxY] = clamp(newMaxY - newMinY, newMinY, newMaxY, this.clampRangeY, opt.yMin, opt.yMax);
							if (opt.zoomFactor_x == 0) [newMinX, newMaxX] = [opt.xMin, opt.xMax];
							if (opt.zoomFactor_y == 0) [newMinY, newMaxY] = [opt.yMin, opt.yMax];
						}

						Assert([newMinX, newMaxX, newMinY, newMaxY].every(a=>!IsNaN(a)), "Found NaN in new scale values.");
						u.batch(()=>{
							u.setScale("x", {min: newMinX, max: newMaxX});
							u.setScale("y", {min: newMinY, max: newMaxY});
						});
					};

					const onup = (e: MouseEvent)=>{
						document.removeEventListener("mousemove", onmove);
						document.removeEventListener("mouseup", onup);
					};

					document.addEventListener("mousemove", onmove);
					document.addEventListener("mouseup", onup);
				}
			});

			// wheel scroll zoom
			plot.addEventListener("wheel", e=>{
				e.preventDefault();

				const {left, top} = u.cursor;

				const leftPct = left! / rect.width;
				const btmPct = 1 - top! / rect.height;
				const xVal = u.posToVal(left!, "x");
				const yVal = u.posToVal(top!, "y");
				const oxRange = u.scales.x.max! - u.scales.x.min!;
				const oyRange = u.scales.y.max! - u.scales.y.min!;

				let nxRange = oxRange;
				let nyRange = oyRange;
				if (e.deltaY < 0) {
					nxRange = oxRange * opt.zoomFactor_x;
					nyRange = oyRange * opt.zoomFactor_y;
				} else {
					if (oxRange < (opt.xRangeMax ?? 0)) nxRange = oxRange / opt.zoomFactor_x;
					if (oyRange < (opt.yRangeMax ?? 0)) nyRange = oyRange / opt.zoomFactor_y;
				}

				let newMinX = xVal - leftPct * nxRange;
				let newMaxX = newMinX + nxRange;
				let newMinY = yVal - btmPct * nyRange;
				let newMaxY = newMinY + nyRange;
				if (opt.clamp) {
					[newMinX, newMaxX] = clamp(nxRange, newMinX, newMaxX, this.clampRangeX, opt.xMin, opt.xMax);
					[newMinY, newMaxY] = clamp(nyRange, newMinY, newMaxY, this.clampRangeY, opt.yMin, opt.yMax);

					if (opt.xRangeMax && newMaxX - newMinX > opt.xRangeMax) {
						const center = (newMinX + newMaxX) / 2;
						newMinX = center - (opt.xRangeMax / 2);
						newMaxX = center + (opt.xRangeMax / 2);
					}
					if (opt.yRangeMax && newMaxY - newMinY > opt.yRangeMax) {
						const center = (newMinY + newMaxY) / 2;
						newMinY = center - (opt.yRangeMax / 2);
						newMaxY = center + (opt.yRangeMax / 2);
					}

					if (opt.zoomFactor_x == 0) [newMinX, newMaxX] = [opt.xMin, opt.xMax];
					if (opt.zoomFactor_y == 0) [newMinY, newMaxY] = [opt.yMin, opt.yMax];
				}

				Assert([newMinX, newMaxX, newMinY, newMaxY].every(a=>!IsNaN(a)), "Found NaN in new scale values.");
				u.batch(()=>{
					u.setScale("x", {min: newMinX, max: newMaxX});
					u.setScale("y", {min: newMinY, max: newMaxY});
				});
			});
		}
	};
}
