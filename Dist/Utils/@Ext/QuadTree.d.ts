export declare function pointWithin(px: any, py: any, rlft: any, rtop: any, rrgt: any, rbtm: any): boolean;
export declare class Quadtree {
    constructor(x: number, y: number, w: number, h: number, l?: number);
    x: number;
    y: number;
    w: number;
    h: number;
    l: number;
    o: any[];
    q: any;
    split(): void;
    quads(x: any, y: any, w: any, h: any, cb: any): void;
    add(o: any): void;
    get(x: any, y: any, w: any, h: any, cb: any): void;
    clear(): void;
}
