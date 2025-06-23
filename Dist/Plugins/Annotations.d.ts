import uPlot from "uplot";
/** Mark some properties which only the former including as optional and set the value to never */
declare type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
/** get the XOR type which could make 2 types exclude each other */
export declare type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export declare type FinalizeOp = "floor" | "ceiling" | "round" | ((val: number) => number) | null;
export declare type PositionIndicator = XOR<{
    value: number;
    value_axis?: string;
    /** See uplot.valToPos for info. */
    value_toCanvasPixels?: boolean;
    finalize?: FinalizeOp;
}, {
    pixel: number | string;
    pixel_relToFullCanvas?: boolean;
    finalize?: FinalizeOp;
}>;
export declare type SizeIndicator = PositionIndicator;
/** See details here: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation */
export declare type DrawType = "source-over" | "source-in" | "source-out" | "source-atop" | "destination-over" | "destination-in" | "destination-out" | "destination-atop" | "lighter" | "copy" | "xor" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
export declare type Annotation = {
    drawType?: DrawType;
    shouldRender?: (info: {
        chart: uPlot;
    }) => boolean;
    extraData?: any;
    /** Called at very start of code for entry's for-loop iteration. (well, right after filtering based on entry.shouldRender) */
    preSetup?: (info: {
        entry: Annotation;
        ctx: CanvasRenderingContext2D;
        chart: uPlot;
    }) => void;
    /** Called just after setting the canvas context's clip, before doing actual drawing. */
    preDraw?: (info: {
        entry: Annotation;
        ctx: CanvasRenderingContext2D;
        chart: uPlot;
    }) => void;
    /** Called after doing the actual drawing for the entry, at end of entry's for-loop iteration. */
    postDraw?: (info: {
        entry: Annotation;
        ctx: CanvasRenderingContext2D;
        chart: uPlot;
    }) => void;
} & (XOR<XOR<XOR<{
    type: "freeform";
}, {
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
}>, {
    type: "line";
    x?: PositionIndicator;
    y?: PositionIndicator;
    color: typeof CanvasRenderingContext2D.prototype.fillStyle;
    lineWidth: number;
}>, {
    type: "text";
    x: PositionIndicator;
    y: PositionIndicator;
    text: string;
    fillStyle?: typeof CanvasRenderingContext2D.prototype.fillStyle;
    strokeStyle?: typeof CanvasRenderingContext2D.prototype.strokeStyle;
    lineWidth?: number;
    textAlign?: typeof CanvasRenderingContext2D.prototype.textAlign;
    font?: typeof CanvasRenderingContext2D.prototype.font;
}>);
declare type Options_OptionalForInitOnly = any;
export declare type AnnotationsOptions_ForInit = Omit<AnnotationsOptions, Options_OptionalForInitOnly> & Partial<Pick<AnnotationsOptions, Options_OptionalForInitOnly>>;
export declare class AnnotationsOptions {
    constructor(opts?: Partial<AnnotationsOptions>);
    annotations: Annotation[];
}
export declare function ConvertPosIndicatorToContextPoint(pos: PositionIndicator, chart: uPlot, context: CanvasRenderingContext2D, defaultScaleKey: "x" | "y", defaultFinalize: FinalizeOp): number;
export declare class AnnotationsPlugin implements uPlot.Plugin {
    constructor(options: ConstructorParameters<typeof AnnotationsOptions>[0]);
    options: AnnotationsOptions;
    hooks: uPlot.Hooks.Defs;
}
export {};
