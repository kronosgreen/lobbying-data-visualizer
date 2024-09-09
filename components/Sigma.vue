<template>
    <div id="nodegraph" style="width: 1080px; height: 800px; margin:0; padding: 0; overflow: hidden;"></div>
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
            }
        },
        mounted() {
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
            const renderer = new Sigma(this.graph, container);

            // Highlight a node's network on hover
            const colors: any = {
                "Industry": "#2a138e",
                "Firm": "#961919",
                "Person": "#459b1d"
            };
            const EDGE_FOCUS = '#444444';
            const EDGE_IGNORE = '#b4b0ba';
            const EDGE_NORMAL = '#b4b0ba';
            const EDGE_SIZE_NORMAL = 0.25;
            const EDGE_SIZE_FOCUS = 4;
            const EDGE_SIZE_IGNORE = 0;

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
                    this.graph.setNodeAttribute(n, "color", activeNodes[n] ? 
                        colors[attr.nodeType] : // color if in network
                        colors[attr.nodeType] + '40' // drop opacity if not in network
                    );
                    this.graph.setNodeAttribute(n, "zIndex", activeNodes[n] ? 1 : -1);
                    this.graph.setNodeAttribute(n, "forceLabel", activeNodes[n] && attr.nodeType != "Person");
                    this.graph.setNodeAttribute(n, "label", activeNodes[n] ? attr.basicLabel : '');
                });
                this.graph.forEachEdge((edge) => {
                    this.graph.setEdgeAttribute(edge, "hidden", !activeEdges[edge]);
                })
                renderer.refresh();
            });

            renderer.on("leaveNode", ({ node }) => {
                this.graph.forEachNode((n: string, attr: any) => {
                    this.graph.setNodeAttribute(n, "color", colors[attr.nodeType]);
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
            }, 5000);
        }
    }
 </script>
 