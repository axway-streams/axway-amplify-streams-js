// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
Vue.use(VueMaterial)
Vue.material.registerTheme('default', {
  primary: 'blue',
  accent: 'red',
  warn: 'red',
  background: 'grey'
})

import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)
Vue.material.registerTheme('default', {
  primary: 'deep-purple',
  accent: 'amber',
  warn: 'red',
  background: 'grey'
})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
