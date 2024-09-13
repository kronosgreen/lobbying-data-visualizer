<template>
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4" >

    </div>
    <div id="nodegraph" class="block items-center justify-between mx-auto p-4" style="height: 960px; width: 1800px"></div>
</template>
 
<script lang="ts">
    import Sigma from "sigma"
    import Graph from "graphology"
    import FA2Layout from 'graphology-layout-forceatlas2/worker'
    

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
                zIndex: true
            });

            // Highlight a node's network on hover
            const colors: any = {
                "Industry": "#2a138e",
                "Firm": "#961919",
                "Person": "#459b1d"
            };

            renderer.on("enterNode", ({ node }) => {
                // Get current node and its neighbors
                let activeNodes: any = {};
                activeNodes[node] = true;
                let activeEdges: any = {};
                this.graph.neighbors(node).forEach((n: string) => {
                    activeNodes[n] = true;
                    activeEdges[this.graph.edge(node, n) ?? 'undefined'] = true;
                    if(this.graph.getNodeAttribute(n, "nodeType") != "Industry") {
                        this.graph.neighbors(n).forEach((n_squared: string) => {
                            activeEdges[this.graph.edge(n, n_squared) ?? 'undefined'] = true;
                            activeNodes[n_squared] = true
                        });
                    }
                });
                this.graph.forEachNode((n: string, attr: any) => {
                    let color = attr.nodeType == "Firm" ? this.sectorColors[attr.sector] : colors[attr.nodeType]
                    this.graph.setNodeAttribute(n, "color", activeNodes[n] ? 
                        color : // color if in network
                        color + '40' // drop opacity if not in network
                    );
                    this.graph.setNodeAttribute(n, "zIndex", activeNodes[n] ? 1 : -1);
                    this.graph.setNodeAttribute(n, "forceLabel", activeNodes[n] && attr.nodeType != "Person");
                    this.graph.setNodeAttribute(n, "label", activeNodes[n] ? attr.label : '');
                });
                this.graph.setNodeAttribute(node, "label", this.graph.getNodeAttribute(node, "highlightLabel"))
                this.graph.forEachEdge((edge) => {
                    this.graph.setEdgeAttribute(edge, "hidden", !activeEdges[edge]);
                    this.graph.setEdgeAttribute(edge, "zIndex", !activeEdges[edge] ? 1 : -1);
                })
                renderer.refresh();
            });

            renderer.on("leaveNode", ({ node }) => {
                this.graph.forEachNode((n: string, attr: any) => {
                    let color = attr.nodeType == "Firm" ? this.sectorColors[attr.sector] : colors[attr.nodeType];
                    this.graph.setNodeAttribute(n, "color", color);
                    this.graph.setNodeAttribute(n, "zIndex", 0);
                    this.graph.setNodeAttribute(n, "forceLabel", false);
                    this.graph.setNodeAttribute(n, "label", attr.basicLabel);
                });
                this.graph.forEachEdge((edge) => {
                    this.graph.setEdgeAttribute(edge, "hidden", false);
                })
                renderer.refresh();
            });

            setTimeout(function() {
                layout.stop();
            }, 10000);
        }
    }
 </script>
 