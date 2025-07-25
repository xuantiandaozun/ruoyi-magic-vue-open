<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!settingsStore.topNav" />
    <top-nav id="topmenu-container" class="topmenu-container" v-if="settingsStore.topNav" />

    <div class="right-menu">
      <template v-if="appStore.device !== 'mobile'">
        <header-search id="header-search" class="right-menu-item" />



        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <el-tooltip content="主题模式" effect="dark" placement="bottom">
          <div class="right-menu-item hover-effect theme-switch-wrapper" @click="toggleTheme">
            <svg-icon v-if="settingsStore.isDark" icon-class="sunny" />
            <svg-icon v-if="!settingsStore.isDark" icon-class="moon" />
          </div>
        </el-tooltip>

        <el-tooltip content="布局大小" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
      </template>
      <div class="avatar-container">
        <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
          <div class="avatar-wrapper">
            <img :src="userStore.avatar" class="user-avatar" :key="userStore.avatar" />
            <el-icon><caret-bottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <router-link to="/user/profile">
                <el-dropdown-item>个人中心</el-dropdown-item>
              </router-link>
              <el-dropdown-item command="setLayout" v-if="settingsStore.showSettings">
                <span>布局设置</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from 'element-plus'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import HeaderSearch from '@/components/HeaderSearch'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

function toggleSideBar() {
  appStore.toggleSideBar()
}

function handleCommand(command) {
  switch (command) {
    case "setLayout":
      setLayout();
      break;
    case "logout":
      logout();
      break;
    default:
      break;
  }
}

// 计算登录路径，根据环境变量添加正确的基础路径
const getLoginPath = () => {
  const baseUrl = import.meta.env.VITE_APP_ENV === 'production' ? '/admin' : '';
  return `${baseUrl}/login`;
};

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = getLoginPath();
    })
  }).catch(() => { });
}

const emits = defineEmits(['setLayout'])
function setLayout() {
  emits('setLayout');
}

function toggleTheme() {
  settingsStore.toggleTheme()
}
</script>

<style lang='scss' scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: var(--navbar-bg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    display: flex;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 12px;
      height: 100%;
      font-size: 18px;
      color: var(--navbar-text);
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--el-color-primary);
          transform: translateY(-2px);
        }
      }

      &.theme-switch-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        margin-top: 7px;
        background: rgba(0, 0, 0, 0.03);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        svg {
          transition: all 0.5s;
          
          &:hover {
            transform: rotate(30deg) scale(1.15);
          }
        }
      }
    }

    .avatar-container {
      margin-right: 40px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
        
        &:hover {
          opacity: 0.8;
        }

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          object-fit: cover;
        }

        i {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
          transition: transform 0.3s ease;
        }
      }
    }
  }
}
</style>
