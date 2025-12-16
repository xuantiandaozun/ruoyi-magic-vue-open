<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="分类名称" prop="categoryName">
        <el-input
          v-model="queryParams.categoryName"
          placeholder="请输入分类名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分类类型" prop="categoryType">
        <el-select v-model="queryParams.categoryType" placeholder="请选择分类类型" clearable>
          <el-option label="支出" value="0" />
          <el-option label="收入" value="1" />
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
          v-hasPermi="['bill:category:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Sort"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="categoryList"
      row-key="categoryId"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column label="分类名称" align="left" prop="categoryName" show-overflow-tooltip min-width="180" />
      <el-table-column label="分类类型" align="center" prop="categoryType" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.categoryType === '0'" type="danger">支出</el-tag>
          <el-tag v-else type="success">收入</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="图标" align="center" prop="icon" min-width="80">
        <template #default="scope">
          <span style="font-size: 24px;">{{ scope.row.icon }}</span>
        </template>
      </el-table-column>
      <el-table-column label="颜色" align="center" prop="color" min-width="80">
        <template #default="scope">
          <div v-if="scope.row.color" :style="{backgroundColor: scope.row.color, width: '40px', height: '20px', margin: '0 auto', borderRadius: '4px'}"></div>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" min-width="80" />
      <el-table-column label="系统分类" align="center" prop="isSystem" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.isSystem === '1'" type="info">是</el-tag>
          <el-tag v-else type="warning">否</el-tag>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="200">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Plus"
            @click="handleAdd(scope.row)"
            v-hasPermi="['bill:category:add']"
            v-if="scope.row.parentId === 0"
          >新增</el-button>
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:category:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:category:remove']"
            v-if="scope.row.isSystem === '0'"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改账单分类对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="categoryRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="categoryOptions"
            :props="{ value: 'categoryId', label: 'categoryName', children: 'children' }"
            value-key="categoryId"
            placeholder="选择上级分类"
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类类型" prop="categoryType">
          <el-radio-group v-model="form.categoryType">
            <el-radio label="0">支出</el-radio>
            <el-radio label="1">收入</el-radio>
          </el-radio-group>
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

<script setup name="BillCategory">
import { addCategory, delCategory, getCategory, getCategoryTree, listCategory, updateCategory } from "@/api/bill/category";

const { proxy } = getCurrentInstance();

const categoryList = ref([]);
const categoryOptions = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const isExpandAll = ref(true);
const refreshTable = ref(true);

const data = reactive({
  form: {},
  queryParams: {
    categoryName: null,
    categoryType: null,
    status: null
  },
  rules: {
    categoryName: [
      { required: true, message: "分类名称不能为空", trigger: "blur" }
    ],
    categoryType: [
      { required: true, message: "分类类型不能为空", trigger: "change" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询账单分类列表 */
function getList() {
  loading.value = true;
  listCategory(queryParams.value).then(response => {
    categoryList.value = proxy.handleTree(response.rows, "categoryId", "parentId");
    loading.value = false;
  });
}

/** 查询账单分类下拉树结构 */
function getTreeselect() {
  getCategoryTree("0").then(response => {
    const expenseTree = response;
    getCategoryTree("1").then(response => {
      const incomeTree = response;
      categoryOptions.value = [
        {
          categoryId: 0,
          categoryName: '顶级分类',
          children: [...expenseTree, ...incomeTree]
        }
      ];
    });
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
    categoryId: null,
    categoryName: null,
    categoryType: "0",
    parentId: 0,
    icon: null,
    color: null,
    sortOrder: 0,
    isSystem: "0",
    status: "0"
  };
  proxy.resetForm("categoryRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd(row) {
  reset();
  getTreeselect();
  if (row != null && row.categoryId) {
    form.value.parentId = row.categoryId;
    form.value.categoryType = row.categoryType;
  }
  open.value = true;
  title.value = "添加账单分类";
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getTreeselect();
  getCategory(row.categoryId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改账单分类";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["categoryRef"].validate(valid => {
    if (valid) {
      if (form.value.categoryId != null) {
        updateCategory(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addCategory(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除账单分类"' + row.categoryName + '"？').then(function() {
    return delCategory(row.categoryId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
