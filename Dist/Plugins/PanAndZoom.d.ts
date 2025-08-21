import uPlot from "uplot";
import { PartialBy } from "../Utils/General.js";
export type PanAndZoomOptions_Init = ConstructorParameters<typeof PanAndZoomOptions>[0];
export declare class PanAndZoomOptions {
    constructor(data?: PartialBy<PanAndZoomOptions, "pan_mouseButtons" | "zoomFactor_x" | "zoomFactor_y" | "clamp">);
    xMin: number;
    xMax: number;
    xRangeMax: number | null;
    yMin: number;
    yMax: number;
    yRangeMax: number | null;
    pan_mouseButtons: number[];
    zoomFactor_x: number;
    zoomFactor_y: number;
    clamp: boolean;
}
export declare class PanAndZoomPlugin implements uPlot.Plugin {
    constructor(options: PanAndZoomOptions_Init);
    options: PanAndZoomOptions;
    clampRangeX: number;
    clampRangeY: number;
    hooks: {
        ready: (u: uPlot) => void;
    };
}
