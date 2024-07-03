import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";

export class SquareFanoronaGraph extends Graph {
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
                // always connect to the right
                if (col < this.width - 1) {
                    graph.addEdge(fromCell, [col+1, row].join(","));
                }
                if (row < this.height - 1) {
                    // always connect down
                    graph.addEdge(fromCell, [col, row+1].join(","));
                    // sometimes connect down-right and down-left
                    if ( ( (row % 2 === 0) && (col % 2 === 0) ) || ( (row % 2 !== 0) && (col % 2 !== 0) ) ) {
                        // left
                        if (col > 0) {
                            graph.addEdge(fromCell, [col-1, row+1].join(","));
                        }
                        // right
                        if (col < this.width - 1) {
                            graph.addEdge(fromCell, [col+1, row+1].join(","));
                        }
                    }
                }
            }
        }
        return graph;
    }
}
