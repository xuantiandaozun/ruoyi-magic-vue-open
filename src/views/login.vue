<template>
  <div class="login">
    <div class="bg-decoration">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-lines"></div>
    </div>
    
    <div class="login-container">
      <div class="login-card">
        <div class="card-glow"></div>
        <div class="login-header">
          <div class="logo-wrapper">
            <div class="logo-ring"></div>
            <img src="@/assets/logo/logo.png" class="logo-img" alt="logo" />
          </div>
          <h1 class="title">后台管理系统</h1>
          <p class="subtitle">安全登录，管理您的业务</p>
        </div>
        
        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="username">
            <div class="input-wrapper">
              <el-input
                v-model="loginForm.username"
                type="text"
                size="large"
                auto-complete="off"
                placeholder="账号"
                class="custom-input"
              >
                <template #prefix>
                  <div class="input-icon-wrapper">
                    <svg-icon icon-class="user" class="input-icon" />
                  </div>
                </template>
              </el-input>
            </div>
          </el-form-item>
          
          <el-form-item prop="password">
            <div class="input-wrapper">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                auto-complete="off"
                placeholder="密码"
                class="custom-input"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <div class="input-icon-wrapper">
                    <svg-icon icon-class="password" class="input-icon" />
                  </div>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="loginForm.rememberMe" class="remember-checkbox">记住密码</el-checkbox>
            <a href="javascript:void(0)" class="forgot-link">忘记密码?</a>
          </div>
          
          <el-form-item class="button-item">
            <button
              type="button"
              class="login-button"
              :class="{ loading: loading }"
              :disabled="loading"
              @click.prevent="handleLogin"
            >
              <span class="button-content">
                <span class="button-text">{{ loading ? '登录中' : '登录' }}</span>
                <span class="button-arrow" v-if="!loading">→</span>
                <span class="button-loader" v-else></span>
              </span>
              <span class="button-glow"></span>
            </button>
          </el-form-item>
          
          <div class="register-link" v-if="register">
            <span>还没有账号?</span>
            <router-link class="link-type" :to="'/register'">立即注册</router-link>
          </div>
        </el-form>
      </div>
    </div>
    
    <div class="el-login-footer">
      <span>Copyright © 2018-2024 ruoyi.vip All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup>

import Cookies from "js-cookie";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false
});

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }]
};

const loading = ref(false);
// 注册开关
const register = ref(false);
const redirect = ref(undefined);

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect;
}, { immediate: true });

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true;
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 });
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 });
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 });
      } else {
        // 否则移除
        Cookies.remove("username");
        Cookies.remove("password");
        Cookies.remove("rememberMe");
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query;
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur];
          }
          return acc;
        }, {});
        router.push({ path: redirect.value || "/", query: otherQueryParams });
      }).catch(() => {
        loading.value = false;
      });
    }
  });
}



function getCookie() {
  const username = Cookies.get("username");
  const password = Cookies.get("password");
  const rememberMe = Cookies.get("rememberMe");
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  };
}

getCookie();
</script>

<style lang='scss' scoped>
$primary: #6366f1;
$primary-dark: #4f46e5;
$primary-light: #818cf8;
$accent: #22d3ee;
$bg-dark: #0f0f23;
$card-bg: rgba(17, 17, 39, 0.85);
$border-color: rgba(99, 102, 241, 0.2);

.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: $bg-dark url('@/assets/images/login-background.jpg') center/cover no-repeat;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(15, 15, 35, 0.4) 0%, rgba(15, 15, 35, 0.8) 100%);
    z-index: 1;
  }
}

.login-container {
  position: relative;
  z-index: 10;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 24px;
  padding: 48px 40px;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 480px) {
    width: 92%;
    padding: 36px 24px;
  }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.4));
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float 20s infinite ease-in-out;
  }
  
  .orb-1 {
    width: 500px;
    height: 500px;
    background: linear-gradient(135deg, $primary, transparent);
    top: -15%;
    left: -10%;
    animation-delay: 0s;
  }
  
  .orb-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, $accent, transparent);
    bottom: -10%;
    right: -5%;
    animation-delay: -7s;
  }
  
  .orb-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, $primary-light, transparent);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -14s;
  }
  
  .grid-lines {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(20px, 10px) scale(1.02); }
}

.login-container {
  position: relative;
  z-index: 10;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  width: 420px;
  background: $card-bg;
  border-radius: 24px;
  padding: 48px 40px;
  backdrop-filter: blur(20px);
  border: 1px solid $border-color;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 20px 50px rgba(0, 0, 0, 0.4),
    0 0 100px rgba(99, 102, 241, 0.1);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 480px) {
    width: 90%;
    padding: 32px 24px;
    margin: 20px;
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.logo-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  
  .logo-ring {
    position: absolute;
    inset: 0;
    border: 2px solid $primary;
    border-radius: 50%;
    opacity: 0.3;
    animation: pulse-ring 2s infinite;
  }
  
  .logo-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    color: $primary-light;
    filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.5));
  }
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.1; }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-weight: 400;
}

.login-form {
  width: 100%;

  :deep(.el-form-item) {
    margin-bottom: 18px;
    width: 100%;
    display: block;
    
    .el-form-item__content {
      width: 100%;
      margin-left: 0 !important;
    }
  }

  .input-wrapper {
    width: 100%;
    
    :deep(.el-input) {
      width: 100% !important;
    }
  }
}

.input-wrapper {
  position: relative;
  margin-right: 0px;
  
  :deep(.el-input) {
    --el-input-bg-color: rgba(255, 255, 255, 0.03);
    --el-input-border-color: rgba(255, 255, 255, 0.1);
    --el-input-hover-border-color: rgba(99, 102, 241, 0.5);
    --el-input-focus-border-color: $primary;
    --el-input-text-color: #fff;
    --el-input-placeholder-color: rgba(255, 255, 255, 0.3);
  }
  
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px 12px;
    height: 52px;
    box-shadow: none !important;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(99, 102, 241, 0.5);
      background: rgba(255, 255, 255, 0.05);
    }
    
    &.is-focus {
      border-color: $primary;
      background: rgba(99, 102, 241, 0.05);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
    }
  }
  
  :deep(.el-input__inner) {
    height: 44px;
    font-size: 15px;
    font-weight: 400;
    padding: 0 8px;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

.input-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  margin-right: 8px;
}

.input-icon {
  width: 18px;
  height: 18px;
  color: $primary-light;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  
  .remember-checkbox {
    :deep(.el-checkbox__label) {
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
    }
    
    :deep(.el-checkbox__inner) {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      
      &:hover {
        border-color: $primary;
      }
    }
    
    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background: $primary;
      border-color: $primary;
    }
  }
  
  .forgot-link {
    color: $primary-light;
    font-size: 13px;
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: $accent;
      transition: width 0.3s ease;
    }
    
    &:hover {
      color: $accent;
      
      &::after {
        width: 100%;
      }
    }
  }
}

.button-item {
  margin-bottom: 0;
}

.login-button {
  position: relative;
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  .button-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .button-text {
    letter-spacing: 1px;
  }
  
  .button-arrow {
    font-size: 18px;
    transition: transform 0.3s ease;
  }
  
  .button-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, $accent 0%, $primary 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 10px 30px rgba(99, 102, 241, 0.4),
      0 0 60px rgba(99, 102, 241, 0.2);
    
    .button-arrow {
      transform: translateX(4px);
    }
    
    .button-glow {
      opacity: 1;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &.loading {
    cursor: not-allowed;
    opacity: 0.9;
  }
  
  .button-loader {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  
  .link-type {
    color: $primary-light;
    text-decoration: none;
    margin-left: 4px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      color: $accent;
    }
  }
}

.el-login-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  letter-spacing: 0.5px;
  z-index: 10;
}
</style>
