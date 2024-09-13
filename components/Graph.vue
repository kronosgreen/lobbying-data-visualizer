<template>
    <Suspense>
        <ClientOnly>
            <Sigma :graph="graph" :sectorColors="sector_color" fallback="Loading..."/>
        </ClientOnly>
    </Suspense>
</template>

<script lang="ts" setup>
import Graph from "graphology"
import { defineProps } from 'vue'

const props = defineProps<{
    query_data: {
        type: Object,
        required: true
    }
}>();

const { query_data }: any = toRefs(props);

const graph = new Graph();

// Define color for sector of firm
console.log('setting up industry nodes')
let sector_color: any = {};
let palette: string[] = [
    "#fd7f6f",
    "#7eb0d5",
    "#b2e061",
    "#bd7ebe",
    "#ffb55a",
    "#ffee65",
    "#beb9db",
    "#fdcce5",
    "#8bd3c7",
    '#ffffd1',
    '#ff9cee',
    '#dbffd6',
    '#85e3ff',
    '#bffcc6',
    '#ace7ff'
];
let i = 0;
query_data.value.sectors.forEach((sector: any) => {
    sector_color[sector.Name] = palette[i];
    i += 1;
});

// Create node for each firm along w/ people specified and connect
console.log("setting up firm nodes and employees")
query_data.value.firms.forEach((firm: any) => {
    let lobbyingTotal = firm.lobbyingRecordsAggregate.node.Amount.sum;
    let sector = firm.categories[0].industry.sector.Name;
    
    graph.addNode(firm.Name, { 
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: Math.sqrt(lobbyingTotal) / 1000,
        highlightLabel: firm.Name + '\nTotal Spent: $' + lobbyingTotal,
        basicLabel: firm.Name,
        label: firm.Name,
        nodeType: "Firm",
        status: "active",
        sector: sector,
        color: sector_color[sector]
    });
    // Set up each employee and connect to firm
    firm.board.forEach((employee: any) => {
        graph.mergeNode(employee.Name, {
            x: Math.random() * 100,
            y: Math.random() * 50,
            size: 4,
            highlightLabel: employee.Name,
            basicLabel: employee.Name,
            label: employee.Name,
            nodeType: "Person",
            status: "active",
            color: "green"
        });
        graph.mergeEdge(firm.Name, employee.Name, { "status": "active", "size": 0.25 });
    });
});

// Filtering out employees w/ only connected to a single firm
console.log("Filtering employees")
let single_employees: string[] = [];
let empDropped: number = 0;
graph.forEachNode((node, attributes) => {
    let degree = graph.degree(node);
    if(attributes.nodeType == "Person") {
        if(degree <= 1) {
            graph.dropNode(node)
            empDropped += 1;
        } else {
            graph.setNodeAttribute(node, "size", degree)
        }    
    }
})
console.log(empDropped + " employees dropped")

 </script>
 