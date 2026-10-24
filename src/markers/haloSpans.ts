/** Input shape for {@link resolveHaloSegmentSpans} (matches marker halo segments). */
export interface HaloSegmentInput {
    degrees?: number;
    skip?: boolean;
}

export interface HaloSegmentSpan {
    startDeg: number;
    endDeg: number;
    /** False when `skip` is set on the segment. */
    draw: boolean;
    segmentIndex: number;
    /** Resolved arc width in degrees. */
    spanDeg: number;
}

export class HaloSegmentDegreesError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "HaloSegmentDegreesError";
    }
}

/**
 * Resolve clockwise arc spans for a halo marker. When no segment sets `degrees`, splits 360° equally (legacy).
 * Mixed mode: explicit `degrees` sum is subtracted from 360; remaining angle is split equally among segments without `degrees`.
 * When every segment sets `degrees`, values are used as-is (sum may be &lt; 360 for gaps).
 */
export function resolveHaloSegmentSpans(segments: HaloSegmentInput[]): HaloSegmentSpan[] {
    const n = segments.length;
    if (n === 0) {
        throw new HaloSegmentDegreesError("Halo marker requires at least one segment.");
    }

    const hasAnyDegrees = segments.some((s) => s.degrees !== undefined);
    let spanDegrees: number[];

    if (!hasAnyDegrees) {
        const each = 360 / n;
        spanDegrees = segments.map(() => each);
    } else {
        const explicitSum = segments.reduce((sum, s) => sum + (s.degrees ?? 0), 0);
        const implicitCount = segments.filter((s) => s.degrees === undefined).length;
        const allExplicit = implicitCount === 0;

        if (allExplicit) {
            if (explicitSum > 360) {
                throw new HaloSegmentDegreesError(
                    `Halo segment degrees sum to ${explicitSum}, which exceeds 360.`,
                );
            }
            spanDegrees = segments.map((s) => s.degrees!);
        } else {
            const fixedSum = segments
                .filter((s) => s.degrees !== undefined)
                .reduce((sum, s) => sum + s.degrees!, 0);
            const remaining = 360 - fixedSum;
            if (remaining < 0) {
                throw new HaloSegmentDegreesError(
                    `Halo explicit segment degrees sum to ${fixedSum}, which exceeds 360.`,
                );
            }
            const implicitEach = remaining / implicitCount;
            spanDegrees = segments.map((s) => (s.degrees !== undefined ? s.degrees : implicitEach));
        }
    }

    let cursor = 0;
    const out: HaloSegmentSpan[] = [];
    for (let i = 0; i < n; i++) {
        const spanDeg = spanDegrees[i]!;
        const startDeg = cursor;
        cursor += spanDeg;
        out.push({
            startDeg,
            endDeg: startDeg + spanDeg,
            spanDeg,
            draw: segments[i]!.skip !== true,
            segmentIndex: i,
        });
    }
    return out;
}

/** True when the marker should render as a full circle/ellipse (legacy: single equal segment). */
export function haloIsFullCircle(spans: HaloSegmentSpan[]): boolean {
    return spans.length === 1 && spans[0]!.spanDeg >= 360;
}
