<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <!-- <div class="logo-text">
          <span class="logo-letter">M</span>
        </div> -->
        <h1 v-if="false" class="sidebar-title">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <div class="logo-text">
          <span class="logo-letter">M</span>
        </div>
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'
import variables from '@/assets/styles/variables.module.scss'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = import.meta.env.VITE_APP_TITLE;
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);

// 获取Logo背景色
const getLogoBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)';
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg;
});

// 获取Logo文字颜色
const getLogoTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)';
  }
  return sideTheme.value === 'theme-dark' ? '#fff' : variables.menuLightText;
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.module.scss';

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: v-bind(getLogoBackground);
  overflow: hidden;

  a.sidebar-logo-link {
    display: flex !important;
    height: 100%;
    width: 100%;
    align-items: center;
    padding: 0 15px;

    & .logo-text {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, #3a8ee6, #7171C6);
      margin-right: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      flex-shrink: 0;
      
      .logo-letter {
        color: white;
        font-size: 18px;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
      }
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: v-bind(getLogoTextColor);
      font-weight: 600;
      line-height: 28px;
      font-size: 18px;
      font-family: 'Arial', sans-serif;
      white-space: nowrap;
      vertical-align: middle;
    }
  }

  &.collapse {
    .logo-text {
      margin-right: 0px;
    }
  }
}
.sidebar-logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>