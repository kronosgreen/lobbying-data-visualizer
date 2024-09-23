// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  components: true,
  modules: ['@nuxtjs/apollo', '@nuxtjs/tailwindcss'],

  apollo: { 
    clients: { 
      default: { 
        httpEndpoint: 'http://localhost:4000/graphql' 
      } 
    }, 
  },

  build: {
    transpile: ['tslib']
  },

  compatibilityDate: '2024-09-08'
})