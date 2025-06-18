<template>
  <div v-if="!item.hidden">
    <!-- 处理只有一个显示子路由的情况 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <!-- 菜单图标 -->
          <svg-icon :icon-class="onlyOneChild.meta.icon || (item.meta && item.meta.icon)"/>
          <!-- 菜单标题 -->
          <template #title><span class="menu-title" :title="onlyOneChild.meta.title">{{ onlyOneChild.meta.title }}</span></template>
        </el-menu-item>
      </app-link>
    </template>

    <!-- 处理有多个子路由的情况，显示为子菜单 -->
    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" teleported>
      <template v-if="item.meta" #title>
        <!-- 子菜单标题图标 -->
        <svg-icon :icon-class="item.meta && item.meta.icon" />
        <!-- 子菜单标题文本 -->
        <span class="menu-title" :title="item.meta.title">{{ item.meta.title }}</span>
      </template>

      <!-- 递归渲染子菜单项 -->
      <sidebar-item
        v-for="(child, index) in item.children"
        :key="child.path + index"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup>
import { isExternal } from '@/utils/validate'
import AppLink from './Link'
import { getNormalPath } from '@/utils/ruoyi'

// 定义组件属性
const props = defineProps({
  // 路由对象
  item: {
    type: Object,
    required: true
  },
  // 是否为嵌套菜单
  isNest: {
    type: Boolean,
    default: false
  },
  // 基础路径
  basePath: {
    type: String,
    default: ''
  }
})

// 存储唯一子路由
const onlyOneChild = ref({});

/**
 * 判断是否只有一个显示的子路由
 * @param {Array} children 子路由数组
 * @param {Object} parent 父路由对象
 * @returns {Boolean} 是否只有一个显示的子路由
 */
function hasOneShowingChild(children = [], parent) {
  if (!children) {
    children = [];
  }
  // 过滤出所有非隐藏的子路由
  const showingChildren = children.filter(item => {
    if (item.hidden) {
      return false
    }
    onlyOneChild.value = item
    return true
  })

  // 当只有一个子路由时，默认显示该子路由
  if (showingChildren.length === 1) {
    return true
  }

  // 当没有子路由可显示时，显示父路由
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }

  return false
};

/**
 * 解析路由路径
 * @param {String} routePath 路由路径
 * @param {String} routeQuery 路由查询参数
 * @returns {String|Object} 完整路径或路径对象
 */
function resolvePath(routePath, routeQuery) {
  // 处理外部链接
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  // 处理带查询参数的路由
  if (routeQuery) {
    let query = JSON.parse(routeQuery);
    return { path: getNormalPath(props.basePath + '/' + routePath), query: query }
  }
  // 返回标准化的路径
  return getNormalPath(props.basePath + '/' + routePath)
}
</script>

<style lang="scss" scoped>
/* 菜单标题样式 - 处理文本溢出 */
.menu-title {
  display: inline-block;
  max-width: 150px; /* 限制最大宽度，防止文本溢出 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 文本溢出时显示省略号 */
  white-space: nowrap; /* 防止文本换行 */
  vertical-align: middle; /* 垂直居中对齐 */
}

/* 弹出菜单中的标题样式 */
.el-menu--popup {
  .menu-title {
    max-width: 160px; /* 弹出菜单中的标题可以稍宽一些 */
  }
}

/* 菜单项和子菜单标题中的图标样式 */
.el-menu-item, .el-sub-menu__title {
  .svg-icon {
    margin-right: 10px; /* 图标右侧间距 */
    font-size: 18px; /* 图标大小 */
    vertical-align: middle; /* 垂直居中对齐 */
  }
}
</style>
