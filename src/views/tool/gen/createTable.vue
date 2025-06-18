<template>
  <!-- 智能建表表单弹窗 -->
  <el-dialog title="智能建表" v-model="visible" width="800px" top="5vh" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="功能描述" prop="requirement">
        <el-input type="textarea" :rows="4" placeholder="请输入功能描述，例如: 帮我设计一个商品表" v-model="form.requirement" />
      </el-form-item>
      <el-form-item label="包名" prop="packageName">
        <el-input placeholder="请输入包名，例如：com.ruoyi.project.gen" v-model="form.packageName">
          <template #prepend>com.ruoyi.</template>
        </el-input>
      </el-form-item>
      <el-form-item label="模块名" prop="moduleName">
        <el-input placeholder="请输入模块名，例如：business" v-model="form.moduleName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="loading" @click="handleSubmit">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- AI生成状态弹窗 -->
  <el-dialog title="AI智能建表" v-model="statusVisible" width="500px" top="20vh" append-to-body :close-on-click-modal="false" :close-on-press-escape="false">
    <div class="status-container">
      <div class="status-icon">
        <el-icon v-if="taskStatus === 'WAITING'" class="loading-icon" size="48" color="#409EFF">
          <Clock />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'RUNNING'" class="loading-icon rotating" size="48" color="#409EFF">
          <Loading />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'SUCCESS'" size="48" color="#67C23A">
          <SuccessFilled />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'FAILED'" size="48" color="#F56C6C">
          <CircleCloseFilled />
        </el-icon>
      </div>
      <div class="status-text">
        <h3 v-if="taskStatus === 'WAITING'">等待中...</h3>
        <h3 v-else-if="taskStatus === 'RUNNING'">AI生成中...</h3>
        <h3 v-else-if="taskStatus === 'SUCCESS'">生成成功！</h3>
        <h3 v-else-if="taskStatus === 'FAILED'">生成失败</h3>
        <p v-if="taskStatus === 'WAITING'" class="status-desc">任务已提交，正在等待处理</p>
        <p v-else-if="taskStatus === 'RUNNING'" class="status-desc">AI正在分析需求并生成表结构，请稍候...</p>
        <p v-else-if="taskStatus === 'SUCCESS'" class="status-desc">表结构已成功生成，即将跳转到代码生成页面</p>
        <p v-else-if="taskStatus === 'FAILED'" class="status-desc">{{ errorMessage || '生成过程中出现错误，请重试' }}</p>
      </div>
    </div>
    <template #footer v-if="taskStatus === 'FAILED'">
      <div class="dialog-footer">
        <el-button type="primary" @click="closeStatusDialog">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { aiDirectTableAsync, getAsyncTaskStatus } from "@/api/tool/gen";
import { Clock, Loading, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue';

const visible = ref(false);
const loading = ref(false);
const statusVisible = ref(false);
const taskStatus = ref('');
const taskId = ref('');
const errorMessage = ref('');
const pollTimer = ref(null);
const { proxy } = getCurrentInstance();
const router = useRouter();

const emit = defineEmits(["ok"]);

const form = ref({
  requirement: "",
  packageName: "project.gen",
  moduleName: ""
});

const rules = ref({
  requirement: [
    { required: true, message: "请输入功能描述", trigger: "blur" }
  ],
  packageName: [
    { required: true, message: "请输入包名", trigger: "blur" }
  ],
  moduleName: [
    { required: true, message: "请输入模块名", trigger: "blur" }
  ]
});

/** 显示弹框 */
function show() {
  visible.value = true;
  reset();
}

/** 取消按钮 */
function cancel() {
  visible.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    requirement: "",
    packageName: "project.gen",
    moduleName: ""
  };
  loading.value = false;
  proxy.$refs["formRef"]?.resetFields();
}

/** 提交按钮操作 */
function handleSubmit() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      loading.value = true;
      const data = {
        requirement: form.value.requirement,
        packageName: "com.ruoyi." + form.value.packageName,
        moduleName: form.value.moduleName
      };
      
      aiDirectTableAsync(data).then(res => {
        // 关闭当前弹窗
        visible.value = false;
        // 获取任务ID
        taskId.value = res;
        // 显示状态弹窗
        showStatusDialog();
        // 开始轮询
        startPolling();
      }).catch(error => {
        proxy.$modal.msgError('提交任务失败：' + error.message);
      }).finally(() => {
        loading.value = false;
      });
    }
  });
}

/** 显示状态弹窗 */
function showStatusDialog() {
  statusVisible.value = true;
  taskStatus.value = 'WAITING';
  errorMessage.value = '';
}

/** 关闭状态弹窗 */
function closeStatusDialog() {
  statusVisible.value = false;
  stopPolling();
  taskStatus.value = '';
  taskId.value = '';
  errorMessage.value = '';
}

/** 开始轮询任务状态 */
function startPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
  }
  
  pollTimer.value = setInterval(() => {
    checkTaskStatus();
  }, 2000); // 每2秒轮询一次
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

/** 检查任务状态 */
function checkTaskStatus() {
  if (!taskId.value) return;
  
  getAsyncTaskStatus(taskId.value).then(res => {
    const status = res.status;
    taskStatus.value = status;
    
    if (status === 'SUCCESS') {
      stopPolling();
      // 延迟1秒后关闭弹窗并触发刷新
      setTimeout(() => {
        closeStatusDialog();
        emit("ok");
        proxy.$modal.msgSuccess('AI建表成功！');
      }, 1000);
    } else if (status === 'FAILED') {
      stopPolling();
      errorMessage.value = res.errorMessage || '任务执行失败';
    }
    // WAITING 和 RUNNING 状态继续轮询
  }).catch(error => {
    stopPolling();
    taskStatus.value = 'FAILED';
    errorMessage.value = '查询任务状态失败：' + error.message;
  });
}

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  stopPolling();
});

defineExpose({
  show,
});
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}

.status-container {
  text-align: center;
  padding: 20px 0;
}

.status-icon {
  margin-bottom: 20px;
}

.loading-icon {
  display: inline-block;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-text h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 500;
}

.status-text .status-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
</style>
