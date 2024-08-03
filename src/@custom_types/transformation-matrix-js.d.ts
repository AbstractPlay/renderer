/** Declaration file generated by dts-gen */

type TriObj = {px: number; py: number; qx: number; qy: number; rx: number; ry: number};
type TriPointArray = [{x: number; y: number}, {x: number; y: number}, {x: number; y: number}];
type TriPoints = [number, number, number, number, number, number]

export class Matrix {
    constructor(context?: CanvasRenderingContext2D, element?: HTMLElement);

    applyToArray(points: [number,number][]): {x: number; y: number}[];

    applyToContext(context: CanvasRenderingContext2D): Matrix;

    applyToElement(element: HTMLElement, use3D: boolean): Matrix;

    applyToObject(obj: {[k: string]: any}): Matrix;

    applyToPoint(x: number, y: number): {x: number; y: number};

    applyToTypedArray(points: number[], use64: boolean): Float32Array|Float64Array;

    clone(noContext: boolean): Matrix;

    concat(cm: Matrix): Matrix;

    decompose(useLU: boolean): {
        translate: { x: number; y: number };
        rotation: number;
        scale: { x: number; y: number };
        skew: { x: number; y: number };
    };

    determinant(): number;

    divide(m: Matrix): Matrix;

    divideScalar(d: number): Matrix;

    flipX(): Matrix;

    flipY(): Matrix;

    interpolate(m2: Matrix, t: number, context: CanvasRenderingContext2D, dom: HTMLElement): Matrix;

    interpolateAnim(m2: Matrix|SVGMatrix, t: number, context: CanvasRenderingContext2D, dom: HTMLElement): Matrix;

    inverse(cloneContext: boolean, cloneDOM: boolean): Matrix;

    isEqual(m: Matrix|SVGMatrix): boolean;

    isIdentity(): boolean;

    isInvertible(): boolean;

    isValid(): boolean;

    multiply(m: Matrix|DOMMatrix|SVGMatrix): Matrix;

    reflectVector(x: number, y: number): {x: number; y: number};

    reset(): Matrix;

    rotate(angle: number): Matrix;

    rotateDeg(angle: number): Matrix;

    rotateFromVector(x: number, y: number): Matrix;

    scale(sx: number, sy: number): Matrix;

    scaleFromVector(x: number, y: number): Matrix;

    scaleU(f: number): Matrix;

    scaleX(sx: number): Matrix;

    scaleY(sy: number): Matrix;

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;

    shear(sx: number, sy: number): Matrix;

    shearX(sx: number): Matrix;

    shearY(sy: number): Matrix;

    skew(ax: number, ay: number): Matrix;

    skewDeg(ax: number, ay: number): Matrix;

    skewX(ax: number): Matrix;

    skewY(ay: number): Matrix;

    toArray(): [number, number, number, number, number, number];

    toCSS(): string;

    toCSS3D(): string;

    toCSV(): string;

    toDOMMatrix(): DOMMatrix;

    toJSON(): string;

    toSVGMatrix(): SVGMatrix;

    toString(fixLen: number): string;

    toTypedArray(): Float32Array;

    transform(a2: number, b2: number, c2: number, d2: number, e2: number, f2: number): Matrix;

    translate(tx: number, ty: number): Matrix;

    translateX(tx: number): Matrix;

    translateY(ty: number): Matrix;

    static from(a: number, b: number, c: number, d: number, e: number, f: number, context: CanvasRenderingContext2D, dom: HTMLElement): Matrix;

    static fromSVGTransformList(tList: SVGTransformList, context: CanvasRenderingContext2D, dom: HTMLElement): Matrix;

    static fromTriangles(t1: TriObj|TriPointArray|TriPoints, t2: TriObj|TriPointArray|TriPoints, context: CanvasRenderingContext2D): Matrix;

}

