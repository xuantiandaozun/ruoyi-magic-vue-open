<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="家庭组名称" prop="familyName">
        <el-input
          v-model="queryParams.familyName"
          placeholder="请输入家庭组名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="邀请码" prop="familyCode">
        <el-input
          v-model="queryParams.familyCode"
          placeholder="请输入邀请码"
          clearable
          @keyup.enter="handleQuery"
        />
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
          v-hasPermi="['bill:family:add']"
        >新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="familyList">
      <el-table-column label="家庭组名称" align="center" prop="familyName" show-overflow-tooltip />
      <el-table-column label="邀请码" align="center" prop="familyCode" min-width="130">
        <template #default="scope">
          <el-tag type="success" style="font-family: monospace;">{{ scope.row.familyCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建者" align="center" prop="creatorName" min-width="100" />
      <el-table-column label="成员数量" align="center" prop="memberCount" min-width="100">
        <template #default="scope">
          <el-tag type="primary">{{ scope.row.memberCount }}人</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" min-width="150">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:family:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:family:remove']"
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

    <!-- 添加或修改家庭组对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="familyRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="家庭组名称" prop="familyName">
          <el-input v-model="form.familyName" placeholder="请输入家庭组名称" />
        </el-form-item>
        <el-form-item label="邀请码" prop="familyCode" v-if="form.familyId">
          <el-input v-model="form.familyCode" disabled>
            <template #append>
              <el-button @click="handleCopyCode">复制</el-button>
            </template>
          </el-input>
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

<script setup name="BillFamily">
import { addFamily, delFamily, getFamily, listFamily, updateFamily } from "@/api/bill/family";
import useClipboard from 'vue-clipboard3';

const { proxy } = getCurrentInstance();
const { toClipboard } = useClipboard();

const familyList = ref([]);
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
    familyName: null,
    familyCode: null,
    status: null
  },
  rules: {
    familyName: [
      { required: true, message: "家庭组名称不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询家庭组列表 */
function getList() {
  loading.value = true;
  listFamily(queryParams.value).then(response => {
    familyList.value = response.rows;
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
    familyId: null,
    familyName: null,
    familyCode: null,
    status: "0"
  };
  proxy.resetForm("familyRef");
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
  title.value = "添加家庭组";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getFamily(row.familyId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改家庭组";
  });
}

/** 复制邀请码 */
async function handleCopyCode() {
  try {
    await toClipboard(form.value.familyCode);
    proxy.$modal.msgSuccess("邀请码已复制到剪贴板");
  } catch (e) {
    proxy.$modal.msgError("复制失败，请手动复制");
  }
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["familyRef"].validate(valid => {
    if (valid) {
      if (form.value.familyId != null) {
        updateFamily(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addFamily(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除家庭组"' + row.familyName + '"？').then(function() {
    return delFamily(row.familyId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
