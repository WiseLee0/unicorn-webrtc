import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Puppet from '@/views/Puppet.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: '/puppet'
  },
  {
    path: '/puppet',
    name: 'puppet',
    component: Puppet
  }, {
    path: '/group',
    name: 'group',
    component: () => import('@/views/Group.vue')
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('@/views/Setting.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
