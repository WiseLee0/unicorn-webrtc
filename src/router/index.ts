import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import Puppet from '../views/Puppet.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'puppet',
        name: 'puppet',
        component: Puppet
      }, {
        path: 'group',
        name: 'group',
        component: () => import('@/views/Group.vue')
      },
      {
        path: 'setting',
        name: 'setting',
        component: () => import('@/views/Setting.vue')
      }
    ]
  },
  {
    path: '/control',
    name: 'control',
    component: () => import('@/views/Control.vue')
  },
  {
    path: '/multiplayer',
    name: 'multiplayer',
    component: () => import('@/views/Multiplayer.vue')
  },
  {
    path: '/record',
    name: 'record',
    component: () => import('@/views/Record.vue')
  },
  {
    path: '/screenshot',
    name: 'screenshot',
    component: () => import('@/views/Screenshot.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
