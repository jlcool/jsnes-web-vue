import Vue from 'vue'
import Router from 'vue-router'
import ListPage from '@/components/ListPage'
import RunPage from '@/components/RunPage'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ListPage',
      component: ListPage
    },
    {
      path: '/run/:rom',
      name: 'RunPage',
      component: RunPage
    }
  ]
})
