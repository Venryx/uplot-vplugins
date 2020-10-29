import uPlot from "uplot";
export declare type PositionIndicatorObj = {
    type: "valueOnAxis";
    axisKey: string;
    value: number;
    /** See uplot.valToPos for info. */
    canvasPixels?: boolean;
} | {
    type: "pixelOnCanvas";
    value: number;
};
export declare type PositionIndicator = number | "min" | "max" | PositionIndicatorObj;
export declare type SizeIndicator = PositionIndicator;
export declare type Annotation = {
    fillStyle: typeof CanvasRenderingContext2D.prototype.fillStyle;
    strokeStyle: typeof CanvasRenderingContext2D.prototype.strokeStyle;
    lineWidth: number;
} & ({
    type: "box";
    xMin?: PositionIndicator;
    xMax?: PositionIndicator;
    xSize?: SizeIndicator;
    yMin?: PositionIndicator;
    yMax?: PositionIndicator;
    ySize?: SizeIndicator;
} | {
    type: "line";
    x?: PositionIndicator;
    y?: PositionIndicator;
});
declare type Options_OptionalForInitOnly = any;
export declare type AnnotationsOptions_ForInit = Omit<AnnotationsOptions, Options_OptionalForInitOnly> & Partial<Pick<AnnotationsOptions, Options_OptionalForInitOnly>>;
export declare class AnnotationsOptions {
    annotations: Annotation[];
}
export declare function ConvertPositionIndicatorToContextPoint(pos: PositionIndicator, chart: uPlot, context: CanvasRenderingContext2D, defaultScaleKey: "x" | "y"): number | undefined;
export declare function AnnotationsPlugin(opts: AnnotationsOptions): {
    hooks: uPlot.PluginHooks;
};
export {};
