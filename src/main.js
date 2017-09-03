// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueCookie from 'vue-cookie';
import Axios from 'axios'
import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap/dist/css/bootstrap.css';

import TreeView from "vue-json-tree-view"
Vue.use(TreeView);

import Chart from "chart.js"
Chart.defaults.global.defaultFontSize = 16;

import 'vue-awesome/icons/edit'
import 'vue-awesome/icons/remove'
import 'vue-awesome/icons/eye'
import 'vue-awesome/icons/eye-slash'
import Icon from 'vue-awesome/components/Icon'
Vue.component('icon', Icon);

import ErrModal from './components/modal/ErrModal'
Vue.component('err-modal', ErrModal);

import Bus from './Bus'
Vue.prototype.$bus = Bus;

Vue.use(BootstrapVue);
Vue.use(VueCookie);
Vue.config.productionTip = false;
Vue.prototype.$http = Axios;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
});
