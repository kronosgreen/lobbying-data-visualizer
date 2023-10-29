<template>
  <div>
    <p>There are {{ data?.firmsAggregate?.count || 0 }} firms.</p>
  </div>
</template>

<script lang="ts" setup>

const query = gql`
query numFirms {
    firmsAggregate {
        count
    }
}`

// const variables = { limit: 5 }
const variables = {}

const { data } = await useAsyncQuery(query, variables)

</script>