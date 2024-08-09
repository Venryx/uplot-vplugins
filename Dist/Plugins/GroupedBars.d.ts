import uPlot from "uplot";
export declare type Orientation = "horizontal" | "vertical";
export declare function GetOrientationValue(orientation: Orientation): 0 | 1;
export declare type Direction = "positive" | "negative";
export declare function GetDirectionValue(direction: Direction): 1 | -1;
export declare type Distribution = "spaceBetween" | "spaceAround" | "spaceEvenly";
export declare function GetDistributionValue(distribution: Distribution): 1 | 2 | 3;
export declare type GroupedBarsPluginOptionsInput = Exclude<ConstructorParameters<typeof GroupedBarsPluginOptions>[0], undefined>;
export declare class GroupedBarsPluginOptions {
    constructor(data?: Partial<GroupedBarsPluginOptions>);
    ori: Orientation;
    dir: Direction;
    stacked: boolean;
    ignore: number[];
    radius: number;
    disp?: any;
    color: string;
    visualGroupDistribution: Distribution;
    barDistribution: Distribution;
    /** Given a certain space of "1" that covers the entire plotting area, how much of that space (.1 = 10%) is used for the gaps between visual-groups? */
    gapBetweenVisualGroups: number;
    /** Given a certain space of "1" that a visual-group has for rendering itself (excludes any gaps between visual-group itself and its neighbors), how much of that space (.1 = 10%) is used for the gaps between its bars? */
    gapBetweenBars: number;
    get Ori_Val(): 0 | 1;
    get Dir_Val(): 1 | -1;
    get VisualGroupDistribution_Val(): 1 | 2 | 3;
    get BarDistribution_Val(): 1 | 2 | 3;
}
export declare function GroupedBarsPlugin(options: GroupedBarsPluginOptionsInput): uPlot.Plugin;
