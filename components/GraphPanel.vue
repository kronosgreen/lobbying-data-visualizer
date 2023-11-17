<template>
   <div id="nodegraph" style="width: 100%; height: 100%; margin:0; padding: 0; overflow: hidden;"></div>
</template>

<script lang="ts">
import Graph from "graphology"
import Sigma from "sigma"

export default {
   mounted() {
      const container = document.getElementById("nodegraph") as HTMLElement;
      const graph = new Graph();

      // Create your nodes
      graph.addNode("John", { x: 0, y: 10, size: 5, label: "John", color: "blue" });
      graph.addNode("Mary", { x: 10, y: 0, size: 5, label: "Mary", color: "red" });

      // Build your edges/connections
      graph.addEdge("John", "Mary");

      // Render
      new Sigma(graph, container);
   }
}
</script>
