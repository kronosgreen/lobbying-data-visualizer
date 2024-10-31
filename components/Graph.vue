<script lang="ts" setup>
import DirectedGraph from "graphology"
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import forceAtlas2 from 'graphology-layout-forceatlas2';
import NoverlapLayout from 'graphology-layout-noverlap/worker';

// Graph loading and chunking properties
const store = useGraphStateStore();
const loading     = ref(true);
const offset      = ref(0);
const limit       = ref(2000);

// Graph object instantiation
const graph = new DirectedGraph();

// Number Formatter
let nf = new Intl.NumberFormat('en-US');

// Sector Colors
const palette: string[] = [
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

// Getting Sectors
const { data: sector_data } = await useAsyncQuery(gql`query { sectors { Name } }`);
let sectors: object[] = sector_data._value.sectors;

// Set sector colors
let i = 0;
const sector_color: any = {};
sectors.forEach((sector: any) => {
  sector_color[sector.Name] = palette[i];
  i += 1;
});

// Query Parameters
const min_spent   = ref(500000.0);
const year        = ref(2012);

// Main Query
const dataQuery = gql`
query GetTopFirms($year: Int, $minSpent: Float, $offset: Int, $limit: Int) {
  TopSpendingFirms(year: $year, minSpent: $minSpent, options: {
      offset: $offset,
      limit: $limit
  }) {
    Name
    totalLobbyingYear(year: $year)
    issuesLobbied(year: $year)
    agenciesLobbied(year: $year)
    performanceOnYearAndPrev(year: $year) {
      TickerSymbol
      Year
      EBITDA
      MarketValue
    }
    sectors
    parent {
      Name
    }
    subsidiaries {
      Name
    }
  }
}`

// Async function to iteratively build Sigma graph
async function fetchAndBuildGraph(offset: number, limit: number) {
  let yearQueried = Number(year.value);

  const dataVariables = {
    "offset": offset,
    "limit": limit,
    "year": yearQueried,
    "minSpent": Number(min_spent.value)
  }
  
  await useAsyncQuery(dataQuery, dataVariables).then((results: any) => {

    results.data._value.TopSpendingFirms.forEach((firm: any) => {
        let sector = (firm.sectors.length > 1) ? "Misc Business" : firm.sectors[0];
        
        // Create Firm node
        try {
          graph.addNode(firm.Name, { 
            x: Math.random() * 100,
            y: Math.random() * 50,
            size: Math.sqrt(firm.totalLobbyingYear) / 160,
            extraDetails: 'Total Spent: $' + nf.format(firm.totalLobbyingYear),
            fundamentals: false,
            label: firm.Name,
            nodeType: "Firm",
            status: "active",
            sector: sector,
            color: sector_color[sector]
          });
        } catch(error: any) {
          // Node already inserted as parent or subsidiary
          if(error.name == "UsageGraphError") {
            graph.mergeNodeAttributes(firm.Name, {
              extraDetails: 'Total Spent: $' + nf.format(firm.totalLobbyingYear),
              sector: sector,
              color: sector_color[sector]
            });
            graph.setNodeAttribute(firm.Name, 'size', Math.sqrt(firm.totalLobbyingYear) / 160);
          }
        }

        // Add performance metrics from annual fundamentals
        if(firm.performanceOnYearAndPrev.length > 0) {
          // Got both the queried year and previous
          if(firm.performanceOnYearAndPrev.length == 2) {
            graph.setNodeAttribute(firm.Name, 'fundamentals', true);

            let currentYearInd = (firm.performanceOnYearAndPrev[0].Year == yearQueried) ? 0 : 1;
            let ebitda = firm.performanceOnYearAndPrev[currentYearInd].EBITDA;
            let marketValue = firm.performanceOnYearAndPrev[currentYearInd].MarketValue;
            let prevYearInd = (currentYearInd == 0) ? 1 : 0;
            graph.mergeNodeAttributes(firm.Name, {
              ebitda: ebitda,
              marketValue: marketValue,
              ticker: firm.performanceOnYearAndPrev[0].TickerSymbol,
              ebitdaChange: ((ebitda / firm.performanceOnYearAndPrev[prevYearInd].EBITDA) - 1) * 100,
              marketValueChange: ((marketValue / firm.performanceOnYearAndPrev[prevYearInd].MarketValue) - 1) * 100,
            });
          }
          // Only got one year
          if(firm.performanceOnYearAndPrev.length == 1 && firm.performanceOnYearAndPrev[0].Year == yearQueried) {
            graph.mergeNodeAttributes(firm.Name, {
              ebitda: firm.performanceOnYearAndPrev[0].EBITDA,
              marketValue: firm.performanceOnYearAndPrev[0].MarketValue,
              ticker: firm.performanceOnYearAndPrev[0].TickerSymbol,
            });
          }
        }

        // Connect to parent company if it has one
        if(firm.parent) {
          if(!graph.hasNode(firm.parent.Name)) {
            graph.setNodeAttribute(firm.Name, "parentCompany", firm.parent.Name);
          } else {
            graph.addDirectedEdge(firm.parent.Name, firm.Name, { "relType": "subsidiary" });
          }
        }

        // Connect to issues
        firm.issuesLobbied.forEach((issue: any) => {
          graph.addDirectedEdge(firm.Name, issue, { "relType": "lobbiedOn" })
        });

        // Connect to agencies
        firm.agenciesLobbied.forEach((agency: any) => {
          graph.addDirectedEdge(firm.Name, agency, { "relType": "lobbiedAgency" })
        })
    });

    loading.value = false; // Toggle loading indicator
  });
}

async function loadData() {
    loading.value = true;
    store.$patch({ loading: true });

    // Restart Graph
    store.nodesLoaded = 0;
    store.edgesLoaded = 0;
    offset.value = 0;
    graph.clear();

    // Getting Issues
    const { data: issue_data } = await useAsyncQuery(gql`query { issues { Issue } }`);
    let issues: object[] = issue_data._value.issues;

    issues.forEach((issue: any) => {
      graph.mergeNode(issue.Issue, {
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: 10,
        label: issue.Issue,
        nodeType: "Issue",
        status: "active",
        color: "red"
      })
    });

    // Getting Agencies
    const { data: agency_data } = await useAsyncQuery(gql`query { agencies { Name } }`);
    let agencies: String[] = agency_data._value.agencies.map((x: any) => x.Name);
    let agenciesUnique = [...new Set(agencies)]

    agenciesUnique.forEach((agency: String) => {
      graph.addNode(agency, {
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: 10,
        label: agency,
        nodeType: "Agency",
        status: "active",
        color: "brown"
      })
    });

    // Get number of records from parameters
    let { data : count_data } = await useAsyncQuery(
      gql`query TopFirmsCount($year: Int, $minSpent: Float) { TopFirmsCount(year: $year, minSpent: $minSpent) }`,
      { "year": Number(year.value), "minSpent": Number(min_spent.value)}
    );
    let TopFirmsCount: number = count_data._value.TopFirmsCount;

    // Iteratively build graph until all records displayed
    while(offset.value < TopFirmsCount) {
      await fetchAndBuildGraph(offset.value, limit.value);
      offset.value += limit.value;
      store.nodesLoaded = graph.order;
      store.edgesLoaded = graph.size;
    }

    // Update Node Sizes
    issues.forEach((issue: any) => {
      graph.setNodeAttribute( issue.Issue, "size", Math.sqrt(graph.inDegree(issue.Issue)) );
    });

    agenciesUnique.forEach((agency: String) => {
      let lobbiedByCount = graph.inDegree(agency);
      if(lobbiedByCount < 1) {
        // Drop agencies that weren't lobbied
        graph.dropNode( agency );
      } else {
        graph.setNodeAttribute( agency, "size", Math.sqrt(lobbiedByCount) );
      }
    })

    // Organize graph according to layout
    const layout = new FA2Layout(graph, {
      settings: {
          gravity: 1,
          adjustSizes: true,
          barnesHutOptimize: true,
          barnesHutTheta: 0.5,
          slowDown: 2,
          scalingRatio: 10,
          outboundAttractionDistribution: true
      }
    });
    
    // Start the Force-Atlas Layout Process
    layout.start();

    // Stop layout after 30 seconds
    setTimeout(function() {
        layout.stop();
    }, 5000);

    // Finished Loading Entire Graph
    store.$patch({ loading: false });
}

// Initial load
loadData();

</script>

<template>
  <div id="graph-render">
    <div class="max-w-screen-xl grid grid-cols-12 gap-4 h-1/4 mx-5 px-5 my-5 py-2" >
        <div class="col-span-3 relative mb-6">
            <label for="min-spent" class="block mb-2 text-sm font-medium text-gray-900">Minimum Spent on Lobbying: ${{ min_spent }}</label>
            <input id="min-spent" v-model="min_spent" type="range" min="0" max="1000000" step="10000" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">Min ($0)</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">Max ($1,000,000)</span>
        </div>

        <div class="col-span-3 relative mb-6">
            <label for="year" class="block mb-2 text-sm font-medium text-gray-900">Year: {{ year }}</label>
            <input id="year" v-model="year" type="range" min="1998" max="2023" step="1" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">1998</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">2023</span>
        </div>

        <button class="row-auto col-span-2 m-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          @click="loadData">
            Refresh Query
        </button>
    </div>
    <div class="max-w-screen-xl grid grid-cols-4 gap-4 h-1/5 m-5 px-5 py-2 space-x-10">
      <!-- Legend -->
      <div class="col-span-1 relative rounded border border-gray-400 p-4">
        <p class="text-xl font-bold my-2">Query Data</p>
        <div class="columns-1">
          <span class="flex my-2">Nodes Loaded: {{ store.nodesLoaded }}</span>
          <span class="flex my-2">Edges Loaded: {{ store.edgesLoaded }}</span>
        </div>
        <p class="text-xl font-bold my-2">Legend</p>
        <p class="text-lg font-bold my-2">Nodes</p>
        <div class="columns-2 my-3 items-center align-middle flex">
          <span class="inline-block w-8 h-8 rounded-full" style="background-color: red;"></span>
          <span class="flex align-middle mx-3">Issues</span>
        </div>
        <div class="columns-2 my-3 items-center align-middle flex">
          <span class="inline-block w-8 h-8 rounded-full" style="background-color: brown;"></span>
          <span class="flex align-middle mx-3">Agency</span>
        </div>
        <p class="text-lg font-bold my-2">Firms: by Sector</p>
        <div class="overflow-auto border border-gray-400 px-4 rounded" style="height: 250px;">
          <div class="columns-2 my-3 items-center align-middle flex" v-for="([key, value], index) in Object.entries(sector_color)" :key="key">
            <span class="inline-block w-8 h-8 rounded-full" :style="{backgroundColor:String(value)}"></span>
            <span class="flex align-middle mx-3">{{ key }}</span>
          </div>
        </div>
      </div>
      <!-- Graph -->
      <div class="col-span-3 relative">
        <span v-if="loading" class="loader"></span>
        <Sigma v-else :graph="graph" :sector_color="sector_color" fallback="Loading..."/>
      </div>
    </div>
  </div>
</template>
 
<style>

/* Spinning Loader Icon */
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