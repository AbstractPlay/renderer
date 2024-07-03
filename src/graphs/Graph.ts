import { DirectedGraph, UndirectedGraph } from "graphology";

export type Vertex = [number,number];
export class Graph {
    public readonly height: number;
    public readonly width: number;
    public graph!: UndirectedGraph|DirectedGraph;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public dropNode(node: Vertex) {
        this.graph.dropNode(node.join(","));
    }

    public listCells(ordered = false): Vertex[] | Vertex[][] {
        if (! ordered) {
            return [...this.graph.nodes()].map(pt => pt.split(",").map(n => parseInt(n, 10)) as Vertex);
        } else {
            const result: Vertex[][] = [];
            for (let row = 0; row < this.height; row++) {
                const node: Vertex[] = [];
                for (let col = 0; col < this.width; col++) {
                    node.push([col, row]);
                }
                result.push(node);
            }
            return result;
        }
    }

    public neighbours(node: Vertex): Vertex[] {
        if (! this.graph.hasNode(node.join(","))) {
            throw new Error(`Cannot find neighbours for nonexistent node "${node.join(",")}"`);
        }
        return [...this.graph.neighbors(node.join(","))].map(pt => pt.split(",").map(n => parseInt(n, 10)) as Vertex);
    }

    public sharesEdge(v1: Vertex, v2: Vertex): boolean {
        try {
            return this.neighbours(v1).find(n => n[0] === v2[0] && n[1] === v2[1]) !== undefined;
        } catch {
            return false;
        }
    }

    public hasNode(v: Vertex): boolean {
        return this.graph.hasNode(v.join(","));
    }
}