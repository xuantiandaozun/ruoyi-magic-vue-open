import { getRouters } from '@/api/menu'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'
import Layout from '@/layout/index'
import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')

const usePermissionStore = defineStore(
  'permission',
  {
    state: () => ({
      routes: [],
      addRoutes: [],
      defaultRoutes: [],
      topbarRouters: [],
      sidebarRouters: []
    }),
    actions: {
      setRoutes(routes) {
        this.addRoutes = routes
        this.routes = constantRoutes.concat(routes)
      },
      setDefaultRoutes(routes) {
        this.defaultRoutes = constantRoutes.concat(routes)
      },
      setTopbarRoutes(routes) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes) {
        this.sidebarRouters = routes
      },
      generateRoutes(roles) {
        return new Promise(resolve => {
          // 向后端请求路由数据
          getRouters().then(res => {
            // 确保返回的数据是有效的数组
            if (!res || !Array.isArray(res)) {
              console.warn('Invalid route data received from server:', res)
              resolve([])
              return
            }

            const sdata = JSON.parse(JSON.stringify(res))
            const rdata = JSON.parse(JSON.stringify(res))
            const defaultData = JSON.parse(JSON.stringify(res))
            const sidebarRoutes = filterAsyncRouter(sdata)
            const rewriteRoutes = filterAsyncRouter(rdata, false, true)
            const defaultRoutes = filterAsyncRouter(defaultData)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)

            // 清除所有动态路由
            let removeRoutes = []
            asyncRoutes.forEach(route => {
              if (route && route.path) {
                const routeObj = router.addRoute(route)
                removeRoutes.push(routeObj)
              }
            })

            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters(constantRoutes.concat(sidebarRoutes))
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes(defaultRoutes)
            resolve(rewriteRoutes)
          }).catch(error => {
            console.error('Error fetching routes:', error)
            resolve([])
          })
        })
      }
    }
  })

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    // 确保路由对象有效且包含必要的属性
    if (!route || !route.path) {
      return false
    }

    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        const loadedComponent = loadView(route.component)
        if (!loadedComponent) {
          console.warn(`Component not found for route: ${route.path}, component: ${route.component}`)
          return false
        }
        route.component = loadedComponent
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el, index) => {
    // 确保子路由对象有效
    if (!el || !el.path) {
      return
    }

    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          if (c && c.path) {
            c.path = el.path + '/' + c.path
            if (c.children && c.children.length) {
              children = children.concat(filterChildren(c.children, c))
              return
            }
            children.push(c)
          }
        })
        return
      }
    }
    if (lastRouter && lastRouter.path) {
      el.path = lastRouter.path + '/' + el.path
      if (el.children && el.children.length) {
        children = children.concat(filterChildren(el.children, el))
        return
      }
    }
    children = children.concat(el)
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []

  // 判断是否是 admin 用户，如果是则直接返回所有路由(超级管理员)
  if (auth.hasRole('admin')) {
    return routes
  }

  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view) => {
  let res;
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0];
    if (dir === view) {
      res = () => modules[path]();
    }
  }
  return res;
}

export default usePermissionStore
