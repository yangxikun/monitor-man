import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'

import CollectionCreate from '@/components/collection/Create'
import CollectionUpdate from '@/components/collection/Update'
import CollectionShow from '@/components/collection/Show'
import Collection from '@/components/collection/Collection'

import HandlerCreate from '@/components/handler/Create'
import HandlerUpdate from '@/components/handler/Update'
import HandlerShow from '@/components/handler/Show'
import Handler from '@/components/handler/Handler'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/collection/create',
      name: 'Collection',
      component: CollectionCreate
    },
    {
      path: '/collection/:id',
      component: Collection,
      children: [
        {
          path: '',
          name: 'CollectionShow',
          component: CollectionShow
        },
        {
          path: 'update',
          name: 'CollectionUpdate',
          component: CollectionUpdate
        }
      ]
    },
    {
      path: '/handler',
      component: Handler,
      children: [
        {
          path: '',
          name: 'HandlerShow',
          component: HandlerShow
        },
        {
          path: 'create',
          name: 'HandlerCreate',
          component: HandlerCreate
        },
        {
          path: ':id/update',
          name: 'HandlerUpdate',
          component: HandlerUpdate
        },
      ]
    }
  ]
})
