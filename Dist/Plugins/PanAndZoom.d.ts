import uPlot from "uplot";
declare type Options_OptionalForInitOnly = "zoomFactor_x" | "zoomFactor_y" | "clamp";
export declare type PanAndZoomOptions_ForInit = Omit<PanAndZoomOptions, Options_OptionalForInitOnly> & Partial<Pick<PanAndZoomOptions, Options_OptionalForInitOnly>>;
export declare class PanAndZoomOptions {
    zoomFactor_x: number;
    zoomFactor_y: number;
    clamp: boolean;
    xMin: number;
    xMax: number;
    xRangeMax?: number;
    yMin: number;
    yMax: number;
    yRangeMax?: number;
}
export declare function PanAndZoomPlugin(opts_partial: PanAndZoomOptions_ForInit): {
    hooks: uPlot.PluginHooks;
};
export {};
