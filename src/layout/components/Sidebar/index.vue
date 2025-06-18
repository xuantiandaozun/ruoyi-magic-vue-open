<template>
  <div :class="{ 'has-logo': showLogo }" class="sidebar-container">
    <!-- 显示Logo组件 -->
    <logo v-if="showLogo" :collapse="isCollapse" />
    <!-- 滚动区域 -->
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="getMenuBackground"
        :text-color="getMenuTextColor"
        :unique-opened="true"
        :active-text-color="theme"
        :collapse-transition="false"
        mode="vertical"
        :class="sideTheme"
      >
        <!-- 递归渲染菜单项 -->
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="route.path + index"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute();
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

// 获取侧边栏路由
const sidebarRouters = computed(() => permissionStore.sidebarRouters);
// 是否显示Logo
const showLogo = computed(() => settingsStore.sidebarLogo);
// 侧边栏主题
const sideTheme = computed(() => settingsStore.sideTheme);
// 主题色
const theme = computed(() => settingsStore.theme);
// 是否折叠侧边栏
const isCollapse = computed(() => !appStore.sidebar.opened);

/**
 * 获取菜单背景色
 * 根据当前主题模式和侧边栏主题设置返回对应的背景色
 */
const getMenuBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)';
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg;
});

/**
 * 获取菜单文字颜色
 * 根据当前主题模式和侧边栏主题设置返回对应的文字颜色
 */
const getMenuTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)';
  }
  return sideTheme.value === 'theme-dark' ? variables.menuText : variables.menuLightText;
});

/**
 * 获取当前激活的菜单项
 * 优先使用路由meta中的activeMenu，否则使用当前路径
 */
const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
});
</script>

<style lang="scss" scoped>
/* 侧边栏容器样式 */
.sidebar-container {
  background-color: v-bind(getMenuBackground);
  transition: background-color 0.3s; /* 背景色过渡动画 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  
  /* 滚动区域样式 */
  .scrollbar-wrapper {
    background-color: v-bind(getMenuBackground);
  }

  /* 菜单样式 */
  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    padding: 6px 10px; /* 内边距，使菜单项不贴边 */
    
    /* 菜单项和子菜单标题共享样式 */
    .el-menu-item, .el-sub-menu__title {
      margin: 4px 0; /* 垂直间距 */
      border-radius: 4px; /* 圆角边框 */
      transition: all 0.3s; /* 过渡动画 */
      
      &:hover {
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important; /* 悬停背景色 */
      }
    }

    /* 菜单项样式 */
    .el-menu-item {
      color: v-bind(getMenuTextColor);
      padding-right: 8px !important; /* 右侧内边距 */
      
      &.is-active {
        color: var(--menu-active-text, #409eff); /* 激活状态文字颜色 */
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important; /* 激活状态背景色 */
        font-weight: bold; /* 激活状态文字加粗 */
      }
    }

    /* 子菜单标题样式 */
    .el-sub-menu__title {
      color: v-bind(getMenuTextColor);
      padding-right: 8px !important; /* 右侧内边距 */
    }
  }
}
</style>
