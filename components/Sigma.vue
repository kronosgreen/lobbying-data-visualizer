<template>
    <div id="nodegraph" class="block items-center justify-between mx-auto p-4" style="height: 960px; width: 1800px"></div>
</template>
 
<script lang="ts">
    import Sigma from "sigma"
    import Graph from "graphology"
    import FA2Layout from 'graphology-layout-forceatlas2/worker'
    import chroma from "chroma-js"
    

    export default {
        props: {
            graph: {
                type: Graph,
                required: true
            },
            sectorColors: {
                type: Object,
                required: true
            }
        },
        mounted() {
            // Rendering Sigma.js 
            console.log("Rendering into sigma.js graph");

            // Define colors for node types
            const colors: any = {
                "Industry": "#2a138e",
                "Firm": "#961919",
                "Person": "#459b1d"
            };
            const container = document.getElementById("nodegraph") as HTMLElement;

            const layout = new FA2Layout(this.graph, {
                settings: {
                    gravity: 2,
                    adjustSizes: true,
                    barnesHutOptimize: true,
                    // outboundAttractionDistribution: true,
                    barnesHutTheta: 2,
                    slowDown: 5,
                    scalingRatio: 5,
                }
            });

            // To start the layout
            layout.start();

            // Render
            const renderer = new Sigma(this.graph, container, {
                maxCameraRatio: 1,
                zIndex: true,
                nodeReducer: (node, data) => {
                    let color = data.nodeType == "Firm" ? this.sectorColors[data.sector] : colors[data.nodeType];
                    let active =  data.status == "active";
                    return {
                        ...data,
                        color: active ? color : chroma(color).alpha(0.3).hex(),
                        zIndex: active ? 1 : -1,
                        label: active ? data.basicLabel : ''
                    }
                },
                // nodeProgramClasses: {
                //     nod
                // }
            });
            renderer.setSetting("h")

            renderer.on("enterNode", ({ node }) => {
                // Get current node and its neighbors
                let activeNodes: any = {};
                let activeEdges: any = {};
                activeNodes[node] = true;
                this.graph.neighbors(node).forEach((neighbor: string) => {
                    activeNodes[neighbor] = true;
                    activeEdges[this.graph.edge(node, neighbor) ?? 'undefined'] = true;
                    this.graph.neighbors(neighbor).forEach((neighborSecond: string) => {
                        // Make sure second degree edges get drawn
                        activeEdges[this.graph.edge(neighbor, neighborSecond) ?? 'undefined'] = true;
                        activeEdges[this.graph.edge(neighborSecond, neighbor) ?? 'undefined'] = true;
                        activeNodes[neighborSecond] = true
                    });
                });
                this.graph.forEachNode((n: string, attr: any) => {
                    this.graph.setNodeAttribute(n, "status", activeNodes[n] ? "active" : "inactive");
                });
                this.graph.forEachEdge((edge) => {
                    this.graph.setEdgeAttribute(edge, "hidden", !activeEdges[edge]);
                })
                renderer.refresh();
            });

            renderer.on("leaveNode", ({ node }) => {
                this.graph.forEachNode((n: string, attr: any) => {
                    this.graph.setNodeAttribute(n, "status", "active");
                });
                this.graph.forEachEdge((edge) => {
                    this.graph.setEdgeAttribute(edge, "hidden", false);
                })
                renderer.refresh();
            });

            setTimeout(function() {
                layout.stop();
            }, 15000);
        }
    }
 </script>
 