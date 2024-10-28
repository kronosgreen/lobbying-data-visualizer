export const useGraphStateStore = defineStore('graphState', () => {
    const loading = ref(false);
    const nodesLoaded = ref(0);
    const edgesLoaded = ref(0);
  
    return { loading, nodesLoaded, edgesLoaded }
  })