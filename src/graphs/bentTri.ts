import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";
import { Graph as BentTriGraph } from "../common/bentTri";
import { IPoint } from "../grids";

export type BentTriNodeData = {
    id: number;
    x: number;
    y: number;
    isOuter: boolean;
};

export class BentTri extends Graph {
    public graph: UndirectedGraph

    constructor(orig: BentTriGraph, positions: Map<number, IPoint>) {
        const frequency = orig.layers.length - 1;
        super(frequency, frequency);
        this.graph = this.buildGraph(orig, positions);
    }

    private buildGraph(orig: BentTriGraph, positions: Map<number, IPoint>): UndirectedGraph {
        const g = new UndirectedGraph();
        const old2new = new Map<number, string>();

        for (const vertex of orig.vertices) {
            const pt = positions.get(vertex.id);
            if (pt === undefined) {
                throw new Error(`Missing display position for vertex ${vertex.id}`);
            }
            const newid = String(vertex.id);
            old2new.set(vertex.id, newid);
            g.addNode(newid, {
                id: vertex.id,
                x: pt.x,
                y: pt.y,
                isOuter: vertex.isOuter,
            } as BentTriNodeData);
        }

        for (const edge of orig.edges) {
            const newA = old2new.get(edge.vidA);
            const newB = old2new.get(edge.vidB);
            if (newA === undefined || newB === undefined) {
                throw new Error(`Could not map the vids ${edge.vidA} or ${edge.vidB} to new ids.`);
            }
            g.addUndirectedEdgeWithKey(`${newA}>${newB}`, newA, newB);
        }
        return g;
    }
}
