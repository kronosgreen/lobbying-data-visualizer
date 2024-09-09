<template>
    <Suspense>
        <ClientOnly>
            <Sigma :graph="graph" fallback="Loading..."/>
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

// Create industry nodes and size by no. firms
console.log('setting up industry nodes')
let industries: any[] = [];
query_data.value.industries.forEach((industry: any) => {
    let firms: number = 0;
    industry.categories.forEach((el:any) => {firms += el.firmsAggregate.count});
    
    graph.addNode(industry.Name, { 
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: Math.sqrt(firms) * 0.5,
        highlightLabel: industry.Name,
        basicLabel: industry.Name,
        label: industry.Name,
        nodeType: "Industry",
        status: "active",
        color: "blue" 
    });
});

// Create node for each firm and connect to previous nodes
console.log("setting up firm nodes and employees")
query_data.value.firms.forEach((firm: any) => {
    graph.addNode(firm.Name, { 
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: Math.sqrt(firm.lobbyingRecordsAggregate.node.Amount.sum) / 1000,
        highlightLabel: firm.Name + '\nTotal Spent: $' + firm.lobbyingRecordsAggregate.node.Amount.sum,
        basicLabel: firm.Name,
        label: firm.Name,
        nodeType: "Firm",
        status: "active",
        color: "red"
    });
    // Connecting firm to its industry
    firm.categories.forEach((cat: any) => {
        graph.mergeEdge(firm.Name, cat.industry.Name, { "status": "active", "size": 0.25 });
    });
    // Set up each employee and connect to firm
    firm.worked.forEach((employee: any) => {
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
    if(attributes.nodeType == "Person" && graph.degree(node) <= 2) {
        graph.dropNode(node)
        empDropped += 1;
    }
})
console.log(empDropped + " employees dropped")

 </script>
 