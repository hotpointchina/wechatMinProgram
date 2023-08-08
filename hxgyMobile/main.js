
// #ifndef VUE3
import Vue from 'vue'
// 引入完整版的 Vue
import VueFull from 'vue/dist/vue.js'
import VueCompositionApi from '@vue/composition-api'
import App from './App'



Vue.config.productionTip = false


VueFull.use(VueCompositionAPI)


App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
// #endif



// #ifdef VUE3
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia';
import App from './App.vue'
export function createApp() {
  const app = createSSRApp(App)
	app.use(Pinia.createPinia());
  return {
    app,
		Pinia,
  }
}
// #endif