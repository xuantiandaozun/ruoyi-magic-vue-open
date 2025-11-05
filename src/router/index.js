import { createRouter, createWebHistory } from 'vue-router';
/* Layout */
import Layout from '@/layout';

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true, noCache: false }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user', noCache: false }
      }
    ]
  },
  {
    path: '/feishu/callback',
    component: () => import('@/views/feishu/callback'),
    name: 'FeishuCallback',
    hidden: true,
    meta: { title: '飞书授权回调' }
  },
  {
    path: '/ai',
    component: Layout,
    redirect: '/ai/chat',
    name: 'Ai',
    meta: { title: 'AI助手', icon: 'robot' },
    children: [
      {
        path: 'chat',
        component: () => import('@/views/ai/chat'),
        name: 'AiChat',
        meta: { title: 'AI对话', icon: 'chat', noCache: true }
      },
      {
        path: 'image',
        component: () => import('@/views/ai/image'),
        name: 'AiImage',
        meta: { title: 'AI生图', icon: 'picture', noCache: true }
      },
      {
        path: 'modelConfig',
        component: () => import('@/views/ai/modelConfig'),
        name: 'AiModelConfig',
        meta: { title: '模型配置', icon: 'setting', noCache: false }
      },
      {
        path: 'workflow',
        component: () => import('@/views/ai/workflow'),
        name: 'AiWorkflow',
        meta: { title: '工作流管理', icon: 'workflow', noCache: false }
      },
      {
        path: 'workflowStep',
        component: () => import('@/views/ai/workflowStep'),
        name: 'AiWorkflowStep',
        hidden: true,
        meta: { title: '工作流步骤', activeMenu: '/ai/workflow', noCache: false }
      },
      {
        path: 'workflowExecution',
        component: () => import('@/views/ai/workflowExecution'),
        name: 'AiWorkflowExecution',
        meta: { title: '工作流执行', icon: 'play', noCache: false }
      },
      {
        path: 'workflow-schedule-log',
        component: () => import('@/views/ai/workflowScheduleLog'),
        name: 'AiWorkflowScheduleLog',
        hidden: true,
        meta: { title: '定时任务日志', activeMenu: '/ai/workflow', noCache: false }
      },
      {
        path: 'blogProductionRecord',
        component: () => import('@/views/ai/blogProductionRecord'),
        name: 'BlogProductionRecord',
        meta: { title: 'AI博客生产', icon: 'list', noCache: false }
      },
      {
        path: 'coverGenerationRecord',
        component: () => import('@/views/ai/coverGenerationRecord'),
        name: 'CoverGenerationRecord',
        meta: { title: 'AI生图记录', icon: 'image', noCache: false }
      }
    ]
  }
]

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user', noCache: true }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role', noCache: true }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict', noCache: false }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job', noCache: false }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen', noCache: true }
      }
    ]
  },
  {
    path: '/tool/gen-preview',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index',
        component: () => import('@/views/tool/gen/previewTable'),
        name: 'PreviewTable',
        meta: { title: '预览生成表', activeMenu: '/tool/gen', noCache: true }
      }
    ]
  },
  {
    path: '/article/blog',
    component: Layout,
    hidden: true,
    permissions: ['article:blog:list'],
    children: [
      {
        path: 'index',
        component: () => import('@/views/article/blog/index'),
        name: 'Blog',
        meta: { title: '文章列表', noCache: false }
      }
    ]
  },
  {
    path: '/article/blog/editor',
    component: Layout,
    hidden: true,
    permissions: ['article:blog:edit'],
    children: [
      {
        path: 'index',
        component: () => import('@/views/article/blog/editor'),
        name: 'BlogEditor',
        meta: { title: '博客内容编辑', activeMenu: '/article/blog', noCache: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_ENV === 'production' ? '/admin/' : '/'),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
});

export default router;
