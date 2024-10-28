// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  components: true,
  modules: ['@nuxtjs/apollo', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  alias: {
    pinia: '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
  },
  apollo: { 
    clients: { 
      default: { 
        httpEndpoint: 'http://localhost:4000/graphql' 
      } 
    }, 
  },
  pinia: {
    storesDirs: ["./stores/**"]
  },
  build: {
    transpile: ['tslib']
  },
  compatibilityDate: '2024-09-08'
})