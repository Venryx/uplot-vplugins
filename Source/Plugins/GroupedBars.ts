import uPlot from "uplot";
import {distr, SPACE_AROUND, SPACE_BETWEEN, SPACE_EVENLY} from "../Utils/@Ext/Distr.js";
import {pointWithin, Quadtree} from "../Utils/@Ext/QuadTree.js";
import {Assert} from "../Utils/FromJSVE.js";

export type Orientation = "horizontal" | "vertical";
export function GetOrientationValue(orientation: Orientation) {
	if (orientation == "horizontal") return 0;
	if (orientation == "vertical") return 1;
	Assert(false, `Invalid orientation value: ${orientation}`);
}

export type Direction = "positive" | "negative";
export function GetDirectionValue(direction: Direction) {
	if (direction == "positive") return 1;
	if (direction == "negative") return -1;
	Assert(false, `Invalid direction value: ${direction}`);
}

export type Distribution = "spaceBetween" | "spaceAround" | "spaceEvenly";
export function GetDistributionValue(distribution: Distribution) {
	if (distribution == "spaceBetween") return SPACE_BETWEEN;
	if (distribution == "spaceAround") return SPACE_AROUND;
	if (distribution == "spaceEvenly") return SPACE_EVENLY;
	Assert(false, `Invalid distribution value: ${distribution}`);
}

export type GroupedBarsPluginOptionsInput = Exclude<ConstructorParameters<typeof GroupedBarsPluginOptions>[0], undefined>;
export class GroupedBarsPluginOptions {
	constructor(data?: Partial<GroupedBarsPluginOptions>) {
		Object.assign(this, data);
	}
	ori: Orientation = "horizontal";
	dir: Direction = "positive";
	stacked = false;
	ignore: number[] = [];
	radius = 0;
	disp?: any;

	// custom
	color = "black";
	visualGroupDistribution: Distribution = "spaceBetween";
	barDistribution: Distribution = "spaceBetween";
	/** Given a certain space of "1" that covers the entire plotting area, how much of that space (.1 = 10%) is used for the gaps between visual-groups? */
	gapBetweenVisualGroups = 0.1;
	/** Given a certain space of "1" that a visual-group has for rendering itself (excludes any gaps between visual-group itself and its neighbors), how much of that space (.1 = 10%) is used for the gaps between its bars? */
	gapBetweenBars = 0;

	// helpers for sending to uplot
	get Ori_Val() { return GetOrientationValue(this.ori); }
	get Dir_Val() { return GetDirectionValue(this.dir); }
	get VisualGroupDistribution_Val() { return GetDistributionValue(this.visualGroupDistribution); }
	get BarDistribution_Val() { return GetDistributionValue(this.barDistribution); }
}

export function GroupedBarsPlugin(options: GroupedBarsPluginOptionsInput): uPlot.Plugin {
	const opt = new GroupedBarsPluginOptions(options);

	let pxRatio;
	let font;

	function setPxRatio() {
		pxRatio = devicePixelRatio;
		font = `${Math.round(10 * pxRatio)}px Arial`;
	}

	setPxRatio();

	window.addEventListener("dppxchange", setPxRatio);

	// calc based on opts above
	const groupWidth = 1 - opt.gapBetweenVisualGroups;
	const barWidth = 1 - opt.gapBetweenBars;

	function distrTwo(groupCount, barCount, barSpread = true, _groupWidth = groupWidth) {
		const out = Array.from({length: barCount}, ()=>({
			offs: Array(groupCount).fill(0),
			size: Array(groupCount).fill(0),
		}));

		distr(groupCount, _groupWidth, opt.VisualGroupDistribution_Val, null, (groupIdx, groupOffPct, groupDimPct)=>{
			distr(barCount, barWidth, opt.BarDistribution_Val, null, (barIdx, barOffPct, barDimPct)=>{
				out[barIdx].offs[groupIdx] = groupOffPct + (barSpread ? (groupDimPct * barOffPct) : 0);
				out[barIdx].size[groupIdx] = groupDimPct * (barSpread ? barDimPct : 1);
			});
		});

		return out;
	}

	let barsPctLayout;
	let barsColors;

	const barsBuilder = uPlot.paths.bars!({
		radius: opt.radius,
		disp: {
			x0: {
				unit: 2,
				//	discr: false, (unary, discrete, continuous)
				values: (u, seriesIdx, idx0, idx1)=>barsPctLayout[seriesIdx].offs,
			},
			size: {
				unit: 2,
				//	discr: true,
				values: (u, seriesIdx, idx0, idx1)=>barsPctLayout[seriesIdx].size,
			},
			...opt.disp,
			/*
				// e.g. variable size via scale (will compute offsets from known values)
				x1: {
					units: 1,
					values: (u, seriesIdx, idx0, idx1) => bucketEnds[idx],
				},
			*/
		},
		each: (u, seriesIdx, dataIdx, lft, top, wid, hgt)=>{
			// we get back raw canvas coords (included axes & padding). translate to the plotting area origin
			lft -= u.bbox.left;
			top -= u.bbox.top;
			qt.add({x: lft, y: top, w: wid, h: hgt, sidx: seriesIdx, didx: dataIdx});
		},
	} as any);

	function drawPoints(u, sidx, i0, i1) {
		u.ctx.save();

		u.ctx.font = font;
		u.ctx.fillStyle = opt.color;

		uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect)=>{
			const _dir = opt.Dir_Val * (opt.ori == "horizontal" ? 1 : -1);

			const wid = Math.round(barsPctLayout[sidx].size[0] * xDim);

			barsPctLayout[sidx].offs.forEach((offs, ix)=>{
				if (dataY[ix] != null) {
					const x0 = xDim * offs;
					const lft = Math.round(xOff + (_dir == 1 ? x0 : xDim - x0 - wid));
					const barWid = Math.round(wid);

					const yPos = valToPosY(dataY[ix] as any, scaleY, yDim, yOff);

					const x = opt.ori == "horizontal" ? Math.round(lft + barWid / 2) : Math.round(yPos);
					const y = opt.ori == "horizontal" ? Math.round(yPos) : Math.round(lft + barWid / 2);

					u.ctx.textAlign = opt.ori == "horizontal" ? "center" : dataY[ix] as any >= 0 ? "left" : "right";
					u.ctx.textBaseline = opt.ori == "vertical" ? "middle" : dataY[ix] as any >= 0 ? "bottom" : "top";

					u.ctx.fillText(dataY[ix], x, y);
				}
			});
		});

		u.ctx.restore();
	}

	function range(u, dataMin, dataMax) {
		const [min, max] = uPlot.rangeNum(0, dataMax, 0.05 as any, true);
		return [0, max];
	}

	let qt;

	return {
		hooks: {
			drawClear: u=>{
				qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);

				qt.clear();

				// force-clear the path cache to cause drawBars() to rebuild new quadtree
				u.series.forEach(s=>{
					(s as any)._paths = null;
				});

				barsPctLayout = ([null] as any[]).concat(distrTwo(u.data[0].length, u.series.length - 1 - opt.ignore.length, !opt.stacked, groupWidth));

				// TODOL only do on setData, not every redraw
				if (opt.disp?.fill != null) {
					barsColors = [null];

					for (let i = 1; i < u.data.length; i++) {
						barsColors.push({
							fill: opt.disp.fill.values(u, i),
							stroke: opt.disp.stroke.values(u, i),
						});
					}
				}
			},
		},
		opts: (u, uplotOpts)=>{
			const yScaleOpts = {
				range,
				ori: opt.ori == "horizontal" ? 1 : 0,
			};

			// hovered
			let hRect;

			uPlot.assign(uplotOpts, {
				select: {show: false},
				cursor: {
					x: false,
					y: false,
					dataIdx: (u, seriesIdx)=>{
						if (seriesIdx == 1) {
							hRect = null;

							const cx = u.cursor.left * pxRatio;
							const cy = u.cursor.top * pxRatio;

							qt.get(cx, cy, 1, 1, o=>{
								if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)) hRect = o;
							});
						}

						return hRect && seriesIdx == hRect.sidx ? hRect.didx : null;
					},
					points: {
						fill: "rgba(255,255,255, 0.3)",
						bbox: (u, seriesIdx)=>{
							const isHovered = hRect && seriesIdx == hRect.sidx;

							return {
								left: isHovered ? hRect.x / pxRatio : -10,
								top: isHovered ? hRect.y / pxRatio : -10,
								width: isHovered ? hRect.w / pxRatio : 0,
								height: isHovered ? hRect.h / pxRatio : 0,
							};
						},
					},
				},
				scales: {
					x: {
						time: false,
						distr: 2,
						ori: opt.Ori_Val,
						dir: opt.Dir_Val,
						//	auto: true,
						range: (u, min, max)=>{
							min = 0;
							max = Math.max(1, u.data[0].length - 1);

							let pctOffset = 0;

							distr(u.data[0].length, groupWidth, opt.VisualGroupDistribution_Val, 0, (di, lftPct, widPct)=>{
								pctOffset = lftPct + widPct / 2;
							});

							const rn = max - min;

							if (pctOffset == 0.5) min -= rn;
							else {
								const upScale = 1 / (1 - pctOffset * 2);
								const offset = (upScale * rn - rn) / 2;

								min -= offset;
								max += offset;
							}

							return [min, max];
						},
					},
					rend: yScaleOpts,
					size: yScaleOpts,
					mem: yScaleOpts,
					inter: yScaleOpts,
					toggle: yScaleOpts,
				},
			});

			if (opt.ori == "vertical") {
				uplotOpts.padding = [0, null, 0, null];
			}

			Assert(uplotOpts.axes?.[0] != null, "Expected opts.axes[0] to be set.");
			uPlot.assign(uplotOpts.axes[0], {
				splits: (u, axisIdx)=>{
					const _dir = opt.Dir_Val * (opt.ori == "horizontal" ? 1 : -1);
					const splits = u._data[0].slice();
					return _dir == 1 ? splits : splits.reverse();
				},
				values: u=>u.data[0],
				gap: 15,
				size: opt.ori == "horizontal" ? 40 : 150,
				labelSize: 20,
				grid: {show: false},
				ticks: {show: false},

				side: opt.ori == "horizontal" ? 2 : 3,
			});

			uplotOpts.series.forEach((s, i)=>{
				if (i > 0 && !opt.ignore.includes(i)) {
					uPlot.assign(s, {
						//	pxAlign: false,
						//	stroke: "rgba(255,0,0,0.5)",
						paths: barsBuilder,
						points: {
							show: drawPoints,
						},
					});
				}
			});
		},
	} as uPlot.Plugin;
}