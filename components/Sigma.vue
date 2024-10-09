<template>
    <div id="nodegraph" class="block items-center justify-between mx-auto p-4" style="height: 960px; width: 1800px"></div>
</template>
 
<script lang="ts">
    import Sigma from "sigma"
    import Graph from "graphology"
    import FA2Layout from 'graphology-layout-forceatlas2/worker'
    import chroma from "chroma-js"
    import type { Settings } from "sigma/settings";
    import type { NodeDisplayData, PartialButFor, PlainObject } from "sigma/types";

    const TEXT_COLOR = "#000000";

    function drawRoundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    /**
     * Custom hover renderer
     */
    function drawHover(context: CanvasRenderingContext2D, data: PlainObject, settings: PlainObject) {
        const size = settings.labelSize;
        const font = settings.labelFont;
        const weight = settings.labelWeight;
        const subLabelSize = size - 2;

        const label = data.label;
        const subLabel = data.extraDetails !== "unknown" ? data.extraDetails : "";
        const sectorLabel = data.sector;

        // Then we draw the label background
        context.beginPath();
        context.fillStyle = "#fff";
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        context.shadowBlur = 8;
        context.shadowColor = "#000";

        context.font = `${weight} ${size}px ${font}`;
        const labelWidth = context.measureText(label).width;
        context.font = `${weight} ${subLabelSize}px ${font}`;
        const subLabelWidth = subLabel ? context.measureText(subLabel).width : 0;
        context.font = `${weight} ${subLabelSize}px ${font}`;
        const sectorLabelWidth = sectorLabel ? context.measureText(sectorLabel).width : 0;

        const textWidth = Math.max(labelWidth, subLabelWidth, sectorLabelWidth);

        const x = Math.round(data.x);
        const y = Math.round(data.y);
        const w = Math.round(textWidth + size / 2 + data.size + 3);
        const hLabel = Math.round(size / 2 + 4);
        const hSubLabel = subLabel ? Math.round(subLabelSize / 2 + 9) : 0;
        const hsectorLabel = Math.round(subLabelSize / 2 + 9);

        drawRoundRect(context, x, y - hSubLabel - 12, w, hsectorLabel + hLabel + hSubLabel + 12, 5);
        context.closePath();
        context.fill();

        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 0;

        // And finally we draw the labels
        context.fillStyle = TEXT_COLOR;
        context.font = `${weight} ${size}px ${font}`;
        context.fillText(label, data.x + data.size + 3, data.y + size / 3);

        if (subLabel) {
            context.fillStyle = TEXT_COLOR;
            context.font = `${weight} ${subLabelSize}px ${font}`;
            context.fillText(subLabel, data.x + data.size + 3, data.y - (2 * size) / 3 - 2);
        }

        context.fillStyle = data.color;
        context.font = `${weight} ${subLabelSize}px ${font}`;
        context.fillText(sectorLabel, data.x + data.size + 3, data.y + size / 3 + 3 + subLabelSize);
    }

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
                    barnesHutTheta: 2,
                    slowDown: 5,
                    scalingRatio: 5,
                }
            });

            // Start the Force-Atlas Layout Process
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

            // Reset active nodes when user stops hovering over one
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
            }, 30000);
        }
    }
 </script>
 