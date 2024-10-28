<script setup lang="ts">
import Sigma from "sigma"
import DirectedGraph from "graphology"
import chroma from "chroma-js"
import { drawHover } from "../assets/ts/drawUtils"
</script>

<template>
    <div id="nodegraph" class="block items-center justify-between mx-auto p-4 border border-gray-400" style="height: 820px; width: 1400px"></div>
</template>
 
<script lang="ts">
export default {
    props: {
        graph: {
            type: DirectedGraph,
            required: true
        },
        sector_color: {
            type: Object,
            required: true
        }
    },
    mounted() {
        
        // Define colors for node types
        const colors: any = {
            "Industry": "#2a138e",
            "Firm": "#961919",
            "Person": "#459b1d",
            "Issue": "red"
        };

        // Rendering Sigma.js
        const container = document.getElementById("nodegraph") as HTMLElement;
        const renderer = new Sigma(this.graph, container, {
            maxCameraRatio: 1,
            zIndex: true,
            nodeReducer: (node, data) => {
                let color = data.nodeType == "Firm" ? (data.sector ? this.sector_color[data.sector] : "gray") : colors[data.nodeType];
                let active =  data.status == "active";
                return {
                    ...data,
                    color: active ? color : chroma(color).alpha(0.3).hex(),
                    zIndex: active ? 1 : -1,
                    label: active ? data.label : ''
                }
            },
            hoverRenderer: drawHover
        });

        // Specify active nodes whenever user hovers over one
        renderer.on("enterNode", ({ node }) => {
            // Get current node and its neighbors
            let activeNodes: any = {};
            let activeEdges: any = {};
            activeNodes[node] = true;
            this.graph.neighbors(node).forEach((neighbor: string) => {
                activeNodes[neighbor] = true;
                activeEdges[this.graph.edge(node, neighbor) ?? 'undefined'] = true;
                if(this.graph.getNodeAttribute(neighbor, "nodeType") != "Issue") { 
                    this.graph.neighbors(neighbor).forEach((neighborSecond: string) => {
                        // Make sure second degree edges get drawn
                        activeEdges[this.graph.edge(neighbor, neighborSecond) ?? 'undefined'] = true;
                        activeEdges[this.graph.edge(neighborSecond, neighbor) ?? 'undefined'] = true;
                        activeNodes[neighborSecond] = true
                    });
                }
            });
            this.graph.forEachNode((n: string, attr: any) => {
                this.graph.setNodeAttribute(n, "status", activeNodes[n] ? "active" : "inactive");
            });
            this.graph.forEachEdge((edge) => {
                this.graph.setEdgeAttribute(edge, "hidden", !activeEdges[edge]);
            })
            renderer.refresh();
        });

        // Reset active nodes when user stops hovering over one
        renderer.on("leaveNode", ({ node }) => {
            this.graph.forEachNode((n: string, attr: any) => {
                this.graph.setNodeAttribute(n, "status", "active");
            });
            this.graph.forEachEdge((edge) => {
                this.graph.setEdgeAttribute(edge, "hidden", false);
            });
            renderer.refresh();
        });

    }
}
 </script>
 