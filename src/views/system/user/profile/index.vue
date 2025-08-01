<template>
   <div class="app-container">
      <el-row :gutter="20">
         <el-col :span="6" :xs="24">
            <el-card class="box-card">
               <template v-slot:header>
                 <div class="clearfix">
                   <span>个人信息</span>
                 </div>
               </template>
               <div>
                  <div class="text-center">
                     <userAvatar :key="state.user.avatar" />
                  </div>
                  <ul class="list-group list-group-striped">
                     <li class="list-group-item">
                        <svg-icon icon-class="user" />用户名称
                        <div class="pull-right">{{ state.user.userName }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="phone" />手机号码
                        <div class="pull-right">{{ state.user.phonenumber }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="email" />用户邮箱
                        <div class="pull-right">{{ state.user.email }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="tree" />所属部门
                        <div class="pull-right" v-if="state.user.dept">{{ state.user.dept.deptName }} / {{ state.postGroup }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="peoples" />所属角色
                        <div class="pull-right">{{ state.roleGroup }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="date" />创建日期
                        <div class="pull-right">{{ state.user.createTime }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="link" />飞书授权
                        <div class="pull-right">
                           <el-tag v-if="state.feishuAuthorized" type="success">已授权</el-tag>
                           <el-tag v-else type="info">未授权</el-tag>
                           <el-button 
                              v-if="!state.feishuAuthorized" 
                              type="primary" 
                              size="small" 
                              style="margin-left: 10px;"
                              @click="handleFeishuAuth"
                              :loading="authLoading">
                              授权飞书
                           </el-button>
                           <el-button 
                              v-if="state.feishuAuthorized" 
                              type="danger" 
                              size="small" 
                              style="margin-left: 10px;"
                              @click="handleRevokeFeishuAuth"
                              :loading="revokeLoading">
                              注销授权
                           </el-button>
                        </div>
                     </li>
                  </ul>
               </div>
            </el-card>
         </el-col>
         <el-col :span="18" :xs="24">
            <el-card>
               <template v-slot:header>
                 <div class="clearfix">
                   <span>基本资料</span>
                 </div>
               </template>
               <el-tabs v-model="activeTab">
                  <el-tab-pane label="基本资料" name="userinfo">
                     <userInfo :user="state.user" />
                  </el-tab-pane>
                  <el-tab-pane label="修改密码" name="resetPwd">
                     <resetPwd />
                  </el-tab-pane>
               </el-tabs>
            </el-card>
         </el-col>
      </el-row>
   </div>
</template>

<script setup name="Profile">
import { getFeishuAuthUrl, getUserProfile, handleFeishuCallback, revokeFeishuAuth } from "@/api/system/user";
import { ElMessage, ElMessageBox } from 'element-plus';
import resetPwd from "./resetPwd";
import userAvatar from "./userAvatar";
import userInfo from "./userInfo";

const activeTab = ref("userinfo");
const authLoading = ref(false);
const revokeLoading = ref(false);
const state = reactive({
  user: {},
  roleGroup: {},
  postGroup: {},
  feishuAuthorized: false
});

function getUser() {
  getUserProfile().then(response => {
    state.user = response.data;
    state.roleGroup = response.roleGroup;
    state.postGroup = response.postGroup;
    state.feishuAuthorized = response.feishuAuthorized || false;
  });
};

// 处理飞书授权
function handleFeishuAuth() {
  authLoading.value = true;
  
  // 构建回调地址
  const redirectUri = `${window.location.origin}/admin/feishu/callback`;
  const state_param = `feishu_auth_${Date.now()}`;
  
  getFeishuAuthUrl(redirectUri, state_param).then(authUrl => {
    // 打开新窗口进行授权
    console.log(authUrl);
    const authWindow = window.open(authUrl, 'feishu_auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    // 监听授权窗口的消息
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data.type === 'FEISHU_AUTH_SUCCESS') {
        // 处理授权成功
        handleFeishuCallback({
          code: event.data.code,
          state: event.data.state,
          redirectUri: redirectUri
        }).then(() => {
          ElMessage.success('飞书授权成功！');
          state.feishuAuthorized = true;
          authWindow.close();
        }).catch(error => {
          ElMessage.error('授权处理失败：' + error.message);
        }).finally(() => {
          authLoading.value = false;
          window.removeEventListener('message', messageHandler);
        });
      } else if (event.data.type === 'FEISHU_AUTH_ERROR') {
        ElMessage.error('飞书授权失败：' + event.data.error);
        authLoading.value = false;
        authWindow.close();
        window.removeEventListener('message', messageHandler);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // 检查窗口是否被关闭
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        authLoading.value = false;
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
    
  }).catch(error => {
    ElMessage.error('获取授权URL失败：' + error.message);
    authLoading.value = false;
  });
}

// 处理飞书授权注销
function handleRevokeFeishuAuth() {
  ElMessageBox.confirm('确定要注销飞书授权吗？注销后将无法使用飞书相关功能。', '确认注销', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    revokeLoading.value = true;
    revokeFeishuAuth().then(() => {
      ElMessage.success('飞书授权注销成功！');
      state.feishuAuthorized = false;
    }).catch(error => {
      ElMessage.error('注销授权失败：' + error.message);
    }).finally(() => {
      revokeLoading.value = false;
    });
  }).catch(() => {
    // 用户取消操作
  });
}

getUser();
</script>
