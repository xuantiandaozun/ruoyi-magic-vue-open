<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="消息类型" prop="msgType" class="search-item">
        <el-select v-model="queryParams.msgType" placeholder="请选择消息类型" clearable style="width: 100%">
          <el-option label="文本" value="text" />
          <el-option label="富文本" value="rich_text" />
          <el-option label="图片" value="image" />
          <el-option label="文件" value="file" />
          <el-option label="语音" value="audio" />
          <el-option label="视频" value="video" />
          <el-option label="卡片" value="interactive" />
        </el-select>
      </el-form-item>
      <el-form-item label="接收方类型" prop="receiveIdType" class="search-item">
        <el-select v-model="queryParams.receiveIdType" placeholder="请选择接收方类型" clearable style="width: 100%">
          <el-option label="用户" value="user" />
          <el-option label="群组" value="group" />
          <el-option label="部门" value="department" />
        </el-select>
      </el-form-item>
      <el-form-item label="接收方ID" prop="receiveId" class="search-item">
        <el-input
          v-model="queryParams.receiveId"
          placeholder="请输入接收方ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="发送状态" prop="status" class="search-item">
        <el-select v-model="queryParams.status" placeholder="请选择发送状态" clearable style="width: 100%">
          <el-option label="发送中" :value="0" />
          <el-option label="发送成功" :value="1" />
          <el-option label="发送失败" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item class="search-buttons">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleSend"
          v-hasPermi="['system:feishu:send']"
        >发送消息</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:feishu:record:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:feishu:record:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="messageRecordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="消息类型" align="center" prop="msgType" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.msgType === 'text'" type="primary">文本</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'rich_text'" type="success">富文本</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'image'" type="warning">图片</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'file'" type="info">文件</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'audio'" type="danger">语音</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'video'" type="dark">视频</el-tag>
          <el-tag v-else-if="scope.row.msgType === 'interactive'" type="primary">卡片</el-tag>
          <el-tag v-else>{{ scope.row.msgType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="接收方类型" align="center" prop="receiveIdType" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.receiveIdType === 'user'" type="primary">用户</el-tag>
          <el-tag v-else-if="scope.row.receiveIdType === 'group'" type="success">群组</el-tag>
          <el-tag v-else-if="scope.row.receiveIdType === 'department'" type="warning">部门</el-tag>
          <el-tag v-else>{{ scope.row.receiveIdType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="接收方ID" align="center" prop="receiveId" width="150" show-overflow-tooltip />
      <el-table-column label="消息内容" align="center" prop="content" min-width="200" show-overflow-tooltip />
      <el-table-column label="发送状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="warning">发送中</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="success">发送成功</el-tag>
          <el-tag v-else-if="scope.row.status === 2" type="danger">发送失败</el-tag>
          <el-tag v-else>{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" align="center" prop="errorMsg" width="200" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['system:feishu:record:query']" size="small">详情</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:feishu:record:remove']" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 消息详情对话框 -->
    <el-dialog title="消息详情" v-model="detailOpen" width="600px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="消息ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="消息类型">
          <el-tag v-if="detailForm.msgType === 'text'" type="primary">文本</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'rich_text'" type="success">富文本</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'image'" type="warning">图片</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'file'" type="info">文件</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'audio'" type="danger">语音</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'video'" type="dark">视频</el-tag>
          <el-tag v-else-if="detailForm.msgType === 'interactive'" type="primary">卡片</el-tag>
          <el-tag v-else>{{ detailForm.msgType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="接收方类型">
          <el-tag v-if="detailForm.receiveIdType === 'user'" type="primary">用户</el-tag>
          <el-tag v-else-if="detailForm.receiveIdType === 'group'" type="success">群组</el-tag>
          <el-tag v-else-if="detailForm.receiveIdType === 'department'" type="warning">部门</el-tag>
          <el-tag v-else>{{ detailForm.receiveIdType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="接收方ID">{{ detailForm.receiveId }}</el-descriptions-item>
        <el-descriptions-item label="消息内容">
          <div style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;">{{ detailForm.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="发送状态">
          <el-tag v-if="detailForm.status === 0" type="warning">发送中</el-tag>
          <el-tag v-else-if="detailForm.status === 1" type="success">发送成功</el-tag>
          <el-tag v-else-if="detailForm.status === 2" type="danger">发送失败</el-tag>
          <el-tag v-else>{{ detailForm.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="detailForm.errorMsg">{{ detailForm.errorMsg }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog title="发送消息" v-model="sendOpen" width="600px" append-to-body @close="resetSendForm">
      <el-form :model="sendForm" :rules="sendRules" ref="sendRef" label-width="auto">
        <el-form-item label="消息类型" prop="msgType" required>
          <el-select v-model="sendForm.msgType" placeholder="请选择消息类型" style="width: 100%">
            <el-option label="文本" value="text" />
            <el-option label="富文本" value="rich_text" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收者ID" prop="receiveId" required>
          <el-select
            v-model="sendForm.receiveId"
            placeholder="请选择飞书用户"
            filterable
            remote
            :remote-method="remoteSearchUsers"
            :loading="userLoading"
            style="width: 100%"
            @change="onUserChange"
          >
            <el-option
              v-for="item in feishuUserList"
              :key="item.userId"
              :label="`${item.name} (${item.userId})`"
              :value="item.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title" v-if="sendForm.msgType === 'rich_text'">
          <el-input
            v-model="sendForm.title"
            placeholder="请输入消息标题"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="消息内容" prop="content" required>
          <el-input
            v-model="sendForm.content"
            type="textarea"
            placeholder="请输入消息内容"
            :rows="6"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="sendOpen = false">取 消</el-button>
          <el-button type="primary" @click="submitSendMessage" :loading="sendLoading">发 送</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FeishuMessageRecord">
import { delFeishuMessageRecord, getFeishuMessageRecord, listFeishuMessageRecord, sendPostMessage, sendTextMessage } from "@/api/feishu/messageRecord";
import { listFeishuUsers } from "@/api/feishu/users";
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const queryRef = ref();
const sendRef = ref();

const messageRecordList = ref([]);
const detailOpen = ref(false);
const sendOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const sendLoading = ref(false);
const userLoading = ref(false);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);
const feishuUserList = ref([]);

const data = reactive({
  detailForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    msgType: null,
    receiveIdType: null,
    receiveId: null,
    status: null,
  },
  sendForm: {
    msgType: 'text',
    receiveId: null,
    title: '',
    content: '',
  },
  sendRules: {
    msgType: [{ required: true, message: '消息类型不能为空', trigger: 'blur' }],
    receiveId: [{ required: true, message: '接收者不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '消息内容不能为空', trigger: 'blur' }],
  }
});

const { queryParams, detailForm, sendForm, sendRules } = toRefs(data);

/** 查询飞书消息发送记录列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listFeishuMessageRecord(queryParams.value);
    messageRecordList.value = response.rows;
    total.value = response.total;
  } catch (error) {
    proxy.$modal.msgError("获取列表失败：" + error);
  } finally {
    loading.value = false;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  multiple.value = !selection.length;
}

/** 详情按钮操作 */
async function handleDetail(row) {
  const id = row.id;
  try {
    const response = await getFeishuMessageRecord(id);
    detailForm.value = response;
    detailOpen.value = true;
  } catch (error) {
    proxy.$modal.msgError("获取详情失败：" + error);
  }
}

/** 发送消息按钮操作 */
function handleSend() {
  resetSendForm();
  sendOpen.value = true;
  // 初始加载飞书用户列表
  loadFeishuUsers('');
}

/** 重置发送表单 */
function resetSendForm() {
  sendForm.value = {
    msgType: 'text',
    receiveId: null,
    title: '',
    content: '',
  };
  feishuUserList.value = [];
  if (sendRef.value) {
    sendRef.value.resetFields();
  }
}

/** 远程搜索飞书用户 */
async function remoteSearchUsers(query) {
  loadFeishuUsers(query);
}

/** 加载飞书用户列表 */
async function loadFeishuUsers(name) {
  userLoading.value = true;
  try {
    const response = await listFeishuUsers({
      name: name,
      pageNum: 1,
      pageSize: 100
    });
    feishuUserList.value = response.rows || [];
  } catch (error) {
    proxy.$modal.msgError("加载飞书用户失败：" + error);
  } finally {
    userLoading.value = false;
  }
}

/** 用户选择变化 */
function onUserChange() {
  // 可以在这里添加额外的逻辑
}

/** 提交发送消息 */
async function submitSendMessage() {
  if (!sendRef.value) {
    return;
  }
  
  sendRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    
    sendLoading.value = true;
    try {
      if (sendForm.value.msgType === 'text') {
        await sendTextMessage(
          sendForm.value.receiveId,
          'user_id',
          sendForm.value.content,
          null
        );
      } else if (sendForm.value.msgType === 'rich_text') {
        await sendPostMessage(
          sendForm.value.receiveId,
          'user_id',
          sendForm.value.title,
          sendForm.value.content,
          null
        );
      }
      
      // 请求成功，拦截器已经处理了错误状态
      proxy.$modal.msgSuccess("消息发送成功");
      sendOpen.value = false;
      // 刷新列表
      getList();
    } catch (error) {
      proxy.$modal.msgError("消息发送失败：" + error.message || error);
    } finally {
      sendLoading.value = false;
    }
  });
}

/** 删除按钮操作 */
async function handleDelete(row) {
  const deleteIds = row.id || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除飞书消息记录编号为"' + deleteIds + '"的数据项？');
    await delFeishuMessageRecord(deleteIds);
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作，无需提示
    } else {
      proxy.$modal.msgError("删除失败：" + error);
    }
  }
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/feishu/record/export', {
    ...queryParams.value
  }, 'feishu_message_record_' + new Date().getTime() + '.xlsx')
}

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  loading.value = false;
});
</script>