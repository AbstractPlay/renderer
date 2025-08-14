import { Graph } from "./Graph";
import { Vertex } from "./Vertex";
import { Edge } from "./Edge";

export { Vertex, Edge, Graph};

/**
 * @return Solution using Gaussian elimination with partial pivoting.
 *         Note: Destructively modifies matrix a.
 */
export const geSolve = (a: number[][], b: number[]): number[] => {
    const EPSILON = 0.0000000001;
    const N = b.length;
    for (let p = 0; p < N; p++) {
        // find pivot row and swap
        let max = p;
        for (let i = p+1; i < N; i++) {
            if (Math.abs(a[i][p]) > Math.abs(a[max][p])) {
                max = i;
            }
        }

        const temp: number[] = [...a[p]];
        a[p] = [...a[max]];
        a[max] = [...temp];

        const t = b[p];
        b[p] = b[max];
        b[max] = t;

        if (Math.abs(a[p][p]) <= EPSILON) {
            throw new Error("Matrix is singular or nearly singular");
        }

        // pivot within a and b
        for (let i = p+1; i < N; i++) {
            const alpha = a[i][p] / a[p][p];
            b[i] -= alpha * b[p];
            for (let j = p; j < N; j++) {
                a[i][j] -= alpha * a[p][j];
            }
        }
    }

    // back substitution
    const soln: number[] = Array.from({length: N}, () => 0);
    for (let i = N - 1; i >= 0; i--) {
        let sum = 0.0;
        for (let j = i + 1; j < N; j++) {
            sum += a[i][j] * soln[j];
        }
        soln[i] = (b[i] - sum) / a[i][i];
    }

    return soln;
}

export const pentagonalBoard = (size: number): Graph => {
    const g = new Graph(size);
    // rotate points
    for (const v of g.vertices) {
        v.setPoint(v.pt!.x * -1, v.pt!.y * -1);
    }
    return g;
}
