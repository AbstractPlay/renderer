import { geSolve } from ".";
import { Edge } from "./Edge";
import { Vertex } from "./Vertex";

export class Graph {
    public vertices: Vertex[] = [];
    public edges: Edge[] = [];
    public layers: Vertex[][][] = [];

    constructor(size: number) {
        this.vertices = [];
        this.edges = [];
        this.makeLayersAndVertices(size);
        this.makeEdges(size);
        this.setOuterLocations(size);
        this.tutteEmbedding();
    }

    private makeLayersAndVertices(size: number): void {
        this.layers = [];

        // add central vertex
        this.vertices.push(new Vertex(0, false));

        // make vertices layer by layer
        for (let layer = 0; layer < size + 1; layer++) {
            const curveList: Vertex[][] = [];
            this.layers.push(curveList);
            const vertsPerCurve = layer + 1;
            let startVertex: Vertex|undefined;
            for (let side = 0; side < 5; side++) {
                const curve: Vertex[] = [];
                curveList.push(curve);
                if (layer === 0) {
                    curve.push(this.vertices[0]);
                } else {
                    for (let n = 0; n < vertsPerCurve; n++) {
                        const vertex: Vertex = (layer === 0) ? this.vertices[0] : new Vertex(this.vertices.length, layer === size);
                        if (startVertex === undefined) {
                            startVertex = vertex;
                        }

                        if (side === 4 && n === vertsPerCurve - 1) {
                            curve.push(startVertex);
                        } else {
                            curve.push(vertex);
                        }

                        if (n < vertsPerCurve - 1) {
                            this.vertices.push(vertex);
                        }
                    }
                }
            }
        }
        // console.log(`Layers are:`);
        // for (let l = 0; l < this.layers.length; l++) {
        //     console.log(`Layer ${l}:`);
        //     for (let s = 0; s < this.layers[l].length; s++) {
        //         console.log(`- Side ${s}:`);
        //         for (const v of this.layers[l][s]) {
        //             console.log(`  V${v.id}`);
        //         }
        //     }
        // }
        // console.log(`vertices: ${this.vertices.map(v => v.toString()).join("\n")}`);
    }

    private makeEdges(size: number): void {
        for (let layer = 0; layer < size + 1; layer++) {
            for (let side = 0; side < 5; side++) {
                const curve = this.layers[layer][side];

                // join consecutive vertices within layer
                for (let n = 0; n < curve.length - 1; n++) {
                    const vidA = curve[n].id;
                    const vidB = curve[n+1].id;
                    this.addEdgeIfUnique(vidA, vidB);
                }

                if (layer < size) {
                    // join adjacent vertices between layers
                    const next = this.layers[layer+1][side];
                    for (let n = 0; n < curve.length; n++) {
                        const vidA = curve[n].id;
                        const vidB1 = next[n].id;
                        const vidB2 = next[n+1].id;

                        this.addEdgeIfUnique(vidA, vidB1);
                        this.addEdgeIfUnique(vidA, vidB2);
                    }
                }

            }
        }

        // set outer edges
        for (const edge of this.edges) {
            // set outer edges
            if (this.vertices[edge.vidA].isOuter && this.vertices[edge.vidB].isOuter) {
                edge.isOuter = true;
            }
        }

        // set incident edges
        for (const edge of this.edges) {
            this.vertices[edge.vidA].addEdge(edge.id);
            this.vertices[edge.vidB].addEdge(edge.id);
        }

        // set vertex nbors
        for (const edge of this.edges) {
            this.vertices[edge.vidA].addNbor(this.vertices[edge.vidB].id);
            this.vertices[edge.vidB].addNbor(this.vertices[edge.vidA].id);
        }
    }

    private addEdgeIfUnique(vidA: number, vidB: number): void {
        for (const edge of this.edges) {
            if (edge.vidA === vidA && edge.vidB === vidB) {
                return;
            }
        }
        this.edges.push(new Edge(this.edges.length, vidA, vidB));
    }

    private setOuterLocations(size: number): void {
        const sideAngle = 2.0 * Math.PI / 5;
        const off = 0.25;

        for (let side = 0; side < 5; side++) {
            const startAngle = 0.5 * Math.PI + side * sideAngle;
            const curve = this.layers[size][side];
            const C = curve.length;

            for (let n = 0; n < C - 1; n++) {
                const t = (n === 0) ? 0.0 : ((n - off) / (C - 1 - 2 * off));
                const angle = startAngle + t * sideAngle;
                let radius = 65 * size;
                const distFromEnd = 1.0 - Math.abs(0.5 - t);
                radius -= Math.pow(distFromEnd, 1.0) / size * 0.5;

                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);

                curve[n].setPoint(x, y);
            }
        }
    }

    private tutteEmbedding() {
        // setup adjacency matrix
        const V = this.vertices.length;
        const K: number[][] = Array.from({length: V}, () => Array.from({length: V}, () => 0));
        for (let row = 0; row < V; row++) {
            for (let col = 0; col < V; col++) {
                const vertexR = this.vertices[row];
                const vertexC = this.vertices[col];
                if (row === col) {
                    K[row][col] = vertexR.nbors.length;
                } else {
                    K[row][col] = vertexR.nbors.includes(vertexC.id) ? -1 : 0;
                }
            }
        }

        // prepare list of indices of internal vertices to solve for
        const internal: number[] = [];
        for (let vid = 0; vid < V; vid++) {
            if (!this.vertices[vid].isOuter) {
                internal.push(vid);
            }
        }
        const S = internal.length;

        // solve for xs
        const ax: number[][] = Array.from({length: S}, () => Array.from({length: S}, () => 0));
        const ay: number[][] = Array.from({length: S}, () => Array.from({length: S}, () => 0));
        const bx: number[] = Array.from({length: S}, () => 0);
        const by: number[] = Array.from({length: S}, () => 0);

        for (let row = 0; row < S; row++) {
            const vidR = internal[row];
            let col = 0;
            for (let v = 0; v < V; v++) {
                const vertexC = this.vertices[v];
                const coeff = K[vidR][v];

                if (vertexC.isOuter) {
                    if (vertexC.pt === undefined) {
                        throw new Error(`vertexC location is not defined!\n${vertexC}`);
                    }
                    // accumulate to RHS
                    bx[row] -= coeff * vertexC.pt.x;
                    by[row] -= coeff * vertexC.pt.y;
                } else {
                    // set coefficient
                    ax[row][col] = coeff;
                    ay[row][col] = coeff;
                    col++;
                }
            }
        }

        const xs = geSolve(ax, bx);
        const ys = geSolve(ay, by);

        for (let s = 0; s < internal.length; s++) {
           this.vertices[internal[s]].setPoint(xs[s], ys[s]);
        }
    }


    public toString = (): string => {
        let str = "";

        if (this.vertices.length === 0) {
            return "Graph has no vertices.";
        }

        str += `${this.vertices.length} vertices:\n`;
        for (const vertex of this.vertices) {
            str += `- ${vertex}\n`;
        }

        if (this.edges.length === 0) {
            str += "No edges.\n";
        } else {
            str += `${this.edges.length} edges:\n`;
            for (const edge of this.edges) {
                str += `- ${edge}\n`;
            }
        }

        return str;
    }
}
