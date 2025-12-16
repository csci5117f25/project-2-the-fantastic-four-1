import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './firebase_conf'

import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import Aura from '@primevue/themes/aura'

const app = createApp(App)

app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth(),
  ],
})

app.use(PrimeVue)

app.use(router)

app.mount('#app')
