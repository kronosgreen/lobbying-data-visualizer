<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator/>
      <Suspense>
        <Graph class="max-w-screen-xl p-3 h-3/4" />
      </Suspense>
    </NuxtLayout>
  </div>
</template>
