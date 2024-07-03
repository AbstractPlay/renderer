import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";

export class SquareDiagGraph extends Graph {
    public graph: UndirectedGraph

    constructor(width: number, height: number) {
        super(width, height);
        this.graph = this.buildGraph();
    }

    private buildGraph(): UndirectedGraph {
        // Build the graph
        const graph = new UndirectedGraph();
        // Nodes
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                graph.addNode([col, row].join(","));
            }
        }
        // Edges
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const fromCell = [col, row].join(",");
                // Up right
                if ( (row > 0) && (col < this.width - 1) ) {
                    graph.addEdge(fromCell, [col+1, row-1].join(","));
                }
                // Up left
                if ( (row > 0) && (col > 0) ) {
                    graph.addEdge(fromCell, [col-1, row-1].join(","));
                }
            }
        }
        return graph;
    }
}
