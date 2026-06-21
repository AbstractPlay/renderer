import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";
import { Graph as StarGraph } from "../common/star";

export type StarNodeData = {
    id: number;
    x: number;
    y: number;
    isOuter: boolean;
    isBridge: boolean;
    isQuark: boolean;
    isPericell: boolean;
};

export class Star extends Graph {
    public graph: UndirectedGraph;

    constructor(orig: StarGraph) {
        super(orig.frequency + 1, orig.frequency + 1);
        this.graph = this.buildGraph(orig);
    }

    private buildGraph(orig: StarGraph): UndirectedGraph {
        const g = new UndirectedGraph();
        const old2new = new Map<number, string>();

        for (let row = 0; row < orig.gridLayers.length; row++) {
            const layer = orig.gridLayers[row]!;
            let col = 0;
            for (const vtx of layer) {
                const vertex = orig.vertices.find(candidate => candidate.id === vtx.id);
                if (vertex === undefined || vertex.pt === undefined) {
                    throw new Error(`Could not find the root vertex ${vtx.id}`);
                }
                const newid = [col, row].join(",");
                old2new.set(vertex.id, newid);
                g.addNode(newid, {
                    id: vertex.id,
                    x: vertex.pt.x,
                    y: vertex.pt.y,
                    isOuter: vertex.isOuter,
                    isBridge: orig.bridgeIds.has(vertex.id),
                    isQuark: orig.quarkIds.has(vertex.id),
                    isPericell: orig.pericellIds.has(vertex.id),
                } as StarNodeData);
                col++;
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
