import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";
import { Graph as PentGraph } from "../common/pentagons";

export type NodeData = {
    id: number;
    x: number;
    y: number;
    isOuter: boolean;
};

export class Pentagonal extends Graph {
    public graph: UndirectedGraph

    constructor(orig: PentGraph) {
        const size = orig.layers.length - 1;
        super(size, size);
        this.graph = this.buildGraph(orig);
    }

    private buildGraph(orig: PentGraph): UndirectedGraph {
        const g = new UndirectedGraph();
        const old2new = new Map<number, string>();
        for (let row = 0; row < orig.layers.length; row++) {
            const layer = orig.layers[row];
            const seen = new Set<number>();
            let col = 0;
            for (const side of layer) {
                for (const vtx of side) {
                    if (seen.has(vtx.id)) {
                        continue;
                    }
                    const vertex = orig.vertices.find(v => v.id === vtx.id);
                    if (vertex === undefined) {
                        throw new Error(`Could not find the root vertex ${vtx.id}`);
                    }
                    const newid = [col,row].join(",");
                    old2new.set(vertex.id, newid)
                    g.addNode(newid, {id: vertex.id, x: vertex.pt!.x, y: vertex.pt!.y, isOuter: vertex.isOuter} as NodeData);
                    seen.add(vertex.id);
                    col++;
                }
            }
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
