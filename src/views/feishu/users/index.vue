<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="用户名称" prop="name" class="search-item">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入用户名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile" class="search-item">
        <el-input
          v-model="queryParams.mobile"
          placeholder="请输入手机号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="邮箱" prop="email" class="search-item">
        <el-input
          v-model="queryParams.email"
          placeholder="请输入邮箱"
          clearable
          @keyup.enter="handleQuery"
        />
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
          @click="handleAdd"
          v-hasPermi="['feishu:users:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['feishu:users:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['feishu:users:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['feishu:users:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="usersList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户名称" align="center" prop="name" min-width="120" show-overflow-tooltip />
      <el-table-column label="手机号" align="center" prop="mobile" width="130" />
      <el-table-column label="邮箱" align="center" prop="email" min-width="180" show-overflow-tooltip />
      <el-table-column label="关联密钥" align="center" prop="keyName" width="150" show-overflow-tooltip>
        <template #default="scope">
          <el-tag v-if="scope.row.keyName" type="success" size="small">{{ scope.row.keyName }}</el-tag>
          <el-tag v-else type="info" size="small">未绑定</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['feishu:users:edit']" size="small">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['feishu:users:remove']" size="small">删除</el-button>
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

    <!-- 添加或修改飞书用户信息对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="usersRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
          <el-form-item label="用户名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入用户名称" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="form.mobile" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="关联密钥" prop="keyId">
            <el-select v-model="form.keyId" placeholder="请选择关联的飞书密钥" clearable filterable style="width: 100%">
              <el-option
                v-for="item in secretKeyOptions"
                :key="item.id"
                :label="item.keyName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FeishuUsers">
import { addFeishuUsers, delFeishuUsers, getFeishuUsers, listFeishuUsers, updateFeishuUsers } from "@/api/feishu/users";
import { getFeishuSecretKeyOptions } from "@/api/system/secretKey";
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const usersRef = ref();
const queryRef = ref();

const usersList = ref([]);
const secretKeyOptions = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    openId: null,
    name: null,
    email: null,
    mobile: null,
  },
  rules: {
    name: [
      { required: true, message: "用户名称不能为空", trigger: "blur" }
    ],
    mobile: [
      { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询飞书用户信息列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listFeishuUsers(queryParams.value);
    usersList.value = response.rows;
    total.value = response.total;
  } catch (error) {
    proxy.$modal.msgError("获取列表失败：" + error);
  } finally {
    loading.value = false;
  }
}

// 取消按钮
function cancel() {
  formLoading.value = false;
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    openId: null,
    unionId: null,
    userId: null,
    name: null,
    email: null,
    mobile: null,
    keyId: null,
    keyName: null,
  };
  if (usersRef.value) {
    usersRef.value.resetFields();
  }
}

/** 获取飞书密钥选项列表 */
async function getSecretKeyOptions() {
  try {
    const response = await getFeishuSecretKeyOptions();
    // 拦截器会自动处理返回 res.data.data 或 res.data
    secretKeyOptions.value = Array.isArray(response) ? response : (response || []);
  } catch (error) {
    console.error("获取密钥列表失败：", error);
    secretKeyOptions.value = [];
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
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
async function handleAdd() {
  try {
    reset();
    await getSecretKeyOptions();
    formLoading.value = false;
    open.value = true;
    title.value = "添加飞书用户信息";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.id || ids.value[0];
  formLoading.value = true;
  try {
    await getSecretKeyOptions();
    const response = await getFeishuUsers(editId);
    form.value = response;
    open.value = true;
    title.value = "修改飞书用户信息";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await usersRef.value.validate();
  } catch (error) {
    return;
  }

  formLoading.value = true;
  try {
    // 根据选择的keyId设置keyName
    if (form.value.keyId) {
      const selectedKey = secretKeyOptions.value.find(item => item.id === form.value.keyId);
      if (selectedKey) {
        form.value.keyName = selectedKey.keyName;
      }
    } else {
      form.value.keyName = null;
    }

    if (form.value.id != null) {
      await updateFeishuUsers(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addFeishuUsers(form.value);
      proxy.$modal.msgSuccess("新增成功");
    }
    open.value = false;
    getList();
  } catch (error) {
    proxy.$modal.msgError("操作失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 删除按钮操作 */
async function handleDelete(row) {
  const deleteIds = row.id || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除飞书用户编号为"' + deleteIds + '"的数据项？');
    await delFeishuUsers(deleteIds);
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
  proxy.download('feishu/users/export', {
    ...queryParams.value
  }, 'feishu_users_' + new Date().getTime() + '.xlsx')
}

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  loading.value = false;
  formLoading.value = false;
});
</script>
