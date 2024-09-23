<template>
  <div id="graph-render">
    <div class="max-w-screen-xl grid grid-cols-6 gap-4 h-1/5 mx-5 px-5 my-5 py-2" >
        <div class="col-span-2 relative mb-6">
            <label for="default-range" class="block mb-2 text-sm font-medium text-gray-900">Minimum Total Spent</label>
            <input id="default-range" type="range" min="0" max="30000000" step="10000" value="10000000" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">Min ($0)</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">Max ($30000000)</span>
        </div>

        <div>

        </div>

        <button class="row-auto m-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
            Refresh Query
        </button>
    </div>
    <span v-if="loading" class="loader"></span>
    <Sigma v-else :graph="graph" :sectorColors="sector_color" fallback="Loading..."/>
  </div>
</template>

<script lang="ts" setup>
import Graph from "graphology"

const loading = ref(true);

const query = gql`
query TopSpendingFirms($fw: FirmWhere) {
  firms(where: $fw) {
    Name
    lobbyingRecordsAggregate {
      node {
        Amount {
          sum
        }
      }
    }
    categories {
      industry {
        sector {
          Name
        }
      }
    }
    board {
      Name
    }
  }
  sectors {
    Name
  }
}`

var MIN_SPENT: number = 1000000.0;
const variables = {
  "fw": {
    "lobbyingRecordsAggregate": {
      "node": {
        "Amount_SUM_GT": MIN_SPENT
      }
    }
  }
}

const graph = new Graph();
let sector_color: any = {};

useAsyncQuery(query, variables).then((results: any) => {
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
    results.data._value.sectors.forEach((sector: any) => {
        sector_color[sector.Name] = palette[i];
        i += 1;
    });

    results.data._value.firms.forEach((firm: any) => {
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
    // Filtering out people w/ only connected to a single firm
    console.log("Filtering people that don't connect firms")
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
    loading.value = false;
});

 </script>
 
 <style>
.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: absolute;
  left: 48vw;
  top: 48vh;
  animation: rotate 1s linear infinite
}
.loader::before , .loader::after {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border: 5px solid #000;
  animation: prixClipFix 2s linear infinite ;
}
.loader::after{
  transform: rotate3d(90, 90, 0, 180deg );
  border-color: #3b82f6;
}

@keyframes rotate {
  0%   {transform: rotate(0deg)}
  100%   {transform: rotate(360deg)}
}

@keyframes prixClipFix {
    0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
    50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
    75%, 100%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
}

</style>