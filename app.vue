<template>
  <div>
    <NuxtLayout>
      <div class="justify-center my-8">
        <p>There are {{ data?.firms?.length || 0 }} firms that have spent at least ${{  MIN_SPENT }}.</p>
      </div>
      <Graph style="width: 100%; height: 800px;" v-bind:query_data="data"/>
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>

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

var MIN_SPENT: number  =  10000000.0;
const variables = {
  "fw": {
    "lobbyingRecordsAggregate": {
      "node": {
        "Amount_SUM_GT": MIN_SPENT
      }
    }
  }
}

const { data }: any = await useAsyncQuery(query, variables)

</script>