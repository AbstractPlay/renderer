import { UndirectedGraph } from "graphology";
import { Graph } from "./Graph";

export class SquareOrthGraph extends Graph {
    public graph: UndirectedGraph

    constructor(width: number, height: number) {
        super(width, height);
        this.graph = this.buildGraph();
    }

    private buildGraph(): UndirectedGraph {
        // Build the graph
        // Orthogonal connections only
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
                // Connect to the right
                if (col < this.width - 1) {
                    graph.addEdge(fromCell, [col+1, row].join(","));
                }
                // Connect up
                if (row > 0) {
                    graph.addEdge(fromCell, [col, row-1].join(","));
                }
            }
        }
        return graph;
    }
}
