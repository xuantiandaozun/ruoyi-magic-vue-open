<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="账户名称" prop="accountName">
        <el-input
          v-model="queryParams.accountName"
          placeholder="请输入账户名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="queryParams.accountType" placeholder="请选择账户类型" clearable>
          <el-option label="现金" value="0" />
          <el-option label="微信" value="1" />
          <el-option label="支付宝" value="2" />
          <el-option label="银行卡" value="3" />
          <el-option label="信用卡" value="4" />
          <el-option label="其他" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item>
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
          v-hasPermi="['bill:account:add']"
        >新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="accountList">
      <el-table-column label="账户名称" align="center" prop="accountName" />
      <el-table-column label="账户类型" align="center" prop="accountType" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.accountType === '0'">现金</el-tag>
          <el-tag v-else-if="scope.row.accountType === '1'" type="success">微信</el-tag>
          <el-tag v-else-if="scope.row.accountType === '2'" type="primary">支付宝</el-tag>
          <el-tag v-else-if="scope.row.accountType === '3'" type="warning">银行卡</el-tag>
          <el-tag v-else-if="scope.row.accountType === '4'" type="danger">信用卡</el-tag>
          <el-tag v-else type="info">其他</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="账号" align="center" prop="accountNo" />
      <el-table-column label="余额" align="center" prop="balance" min-width="120">
        <template #default="scope">
          <span style="font-weight: bold; color: #409EFF;">¥{{ scope.row.balance }}</span>
        </template>
      </el-table-column>
      <el-table-column label="信用额度" align="center" prop="creditLimit" min-width="110">
        <template #default="scope">
          <span v-if="scope.row.creditLimit">¥{{ scope.row.creditLimit }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" min-width="80" />
      <el-table-column label="状态" align="center" prop="status" min-width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:account:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:account:remove']"
          >删除</el-button>
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

    <!-- 添加或修改账户对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="accountRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账户名称" prop="accountName">
          <el-input v-model="form.accountName" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户类型" prop="accountType">
          <el-select v-model="form.accountType" placeholder="请选择账户类型" style="width: 100%;">
            <el-option label="现金" value="0" />
            <el-option label="微信" value="1" />
            <el-option label="支付宝" value="2" />
            <el-option label="银行卡" value="3" />
            <el-option label="信用卡" value="4" />
            <el-option label="其他" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号" prop="accountNo">
          <el-input v-model="form.accountNo" placeholder="银行卡后四位等" />
        </el-form-item>
        <el-form-item label="余额" prop="balance">
          <el-input-number v-model="form.balance" :precision="2" :step="0.01" :min="0" placeholder="请输入余额" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="信用额度" prop="creditLimit" v-if="form.accountType === '4'">
          <el-input-number v-model="form.creditLimit" :precision="2" :step="0.01" :min="0" placeholder="请输入信用额度" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标(emoji)" maxlength="10" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="BillAccount">
import { addAccount, delAccount, getAccount, listAccount, updateAccount } from "@/api/bill/account";

const { proxy } = getCurrentInstance();

const accountList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    accountName: null,
    accountType: null,
    status: null
  },
  rules: {
    accountName: [
      { required: true, message: "账户名称不能为空", trigger: "blur" }
    ],
    accountType: [
      { required: true, message: "账户类型不能为空", trigger: "change" }
    ],
    balance: [
      { required: true, message: "余额不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询账户列表 */
function getList() {
  loading.value = true;
  listAccount(queryParams.value).then(response => {
    accountList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    accountId: null,
    accountName: null,
    accountType: "0",
    accountNo: null,
    balance: 0,
    creditLimit: null,
    icon: null,
    color: null,
    sortOrder: 0,
    status: "0"
  };
  proxy.resetForm("accountRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加账户";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getAccount(row.accountId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改账户";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["accountRef"].validate(valid => {
    if (valid) {
      if (form.value.accountId != null) {
        updateAccount(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addAccount(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除账户"' + row.accountName + '"？').then(function() {
    return delAccount(row.accountId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
