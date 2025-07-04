<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="仓库标题" prop="title" class="search-item">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入仓库标题"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库作者" prop="owner" class="search-item">
        <el-input
          v-model="queryParams.owner"
          placeholder="请输入仓库作者"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库地址" prop="url" class="search-item">
        <el-input
          v-model="queryParams.url"
          placeholder="请输入仓库地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库语言" prop="language" class="search-item">
        <el-input
          v-model="queryParams.language"
          placeholder="请输入仓库语言"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="总上榜天数" prop="trendingDays" class="search-item">
        <el-input
          v-model="queryParams.trendingDays"
          placeholder="请输入总上榜天数"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="连续上榜天数" prop="continuousTrendingDays" class="search-item">
        <el-input
          v-model="queryParams.continuousTrendingDays"
          placeholder="请输入连续上榜天数"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="首次上榜日期" class="search-item date-range-item">
        <el-date-picker
          v-model="daterangeFirstTrendingDate"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="最后一次上榜日期" class="search-item date-range-item">
        <el-date-picker
          v-model="daterangeLastTrendingDate"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
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
          v-hasPermi="['github:trending:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['github:trending:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['github:trending:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['github:trending:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="trendingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="仓库标题" align="center" prop="title" />
      <el-table-column label="仓库作者" align="center" prop="owner" />
      <el-table-column label="仓库描述" align="center" prop="description" />
      <el-table-column label="仓库语言" align="center" prop="language" />
      <el-table-column label="总上榜天数" align="center" prop="trendingDays" />
      <el-table-column label="连续上榜天数" align="center" prop="continuousTrendingDays" />
      <el-table-column label="项目的 star 数量" align="center" prop="starsCount" />
      <el-table-column label="项目的 fork 数量" align="center" prop="forksCount" />
      <el-table-column label="仓库最后更新时间" align="center" prop="githubUpdatedAt" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.githubUpdatedAt, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['github:trending:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['github:trending:remove']">删除</el-button>
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

    <!-- 添加或修改github流行榜单对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="trendingRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="仓库标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入仓库标题" />
        </el-form-item>
        <el-form-item label="仓库作者" prop="owner">
          <el-input v-model="form.owner" placeholder="请输入仓库作者" />
        </el-form-item>
        <el-form-item label="仓库描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="仓库地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入仓库地址" />
        </el-form-item>
        <el-form-item label="仓库语言" prop="language">
          <el-input v-model="form.language" placeholder="请输入仓库语言" />
        </el-form-item>
        <el-form-item label="总上榜天数" prop="trendingDays">
          <el-input v-model="form.trendingDays" placeholder="请输入总上榜天数" />
        </el-form-item>
        <el-form-item label="连续上榜天数" prop="continuousTrendingDays">
          <el-input v-model="form.continuousTrendingDays" placeholder="请输入连续上榜天数" />
        </el-form-item>
        <el-form-item label="首次上榜日期" prop="firstTrendingDate">
          <el-date-picker clearable
            v-model="form.firstTrendingDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择首次上榜日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="最后一次上榜日期" prop="lastTrendingDate">
          <el-date-picker clearable
            v-model="form.lastTrendingDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择最后一次上榜日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="是否翻译描述" prop="isTranDes">
          <el-input v-model="form.isTranDes" placeholder="请输入是否翻译描述" />
        </el-form-item>
        <el-form-item label="项目的 star 数量" prop="starsCount">
          <el-input v-model="form.starsCount" placeholder="请输入项目的 star 数量" />
        </el-form-item>
        <el-form-item label="项目的 fork 数量" prop="forksCount">
          <el-input v-model="form.forksCount" placeholder="请输入项目的 fork 数量" />
        </el-form-item>
        <el-form-item label="开放问题数量" prop="openIssuesCount">
          <el-input v-model="form.openIssuesCount" placeholder="请输入开放问题数量" />
        </el-form-item>
        <el-form-item label="仓库创建时间" prop="githubCreatedAt">
          <el-date-picker clearable
            v-model="form.githubCreatedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择仓库创建时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="仓库最后更新时间" prop="githubUpdatedAt">
          <el-date-picker clearable
            v-model="form.githubUpdatedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择仓库最后更新时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="readme 文件路径" prop="readmePath">
          <el-input v-model="form.readmePath" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="readme 文件跟新日期" prop="readmeUpdatedAt">
          <el-date-picker clearable
            v-model="form.readmeUpdatedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择readme 文件跟新日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="是否需要跟新项目" prop="isNeedUpdate">
          <el-input v-model="form.isNeedUpdate" placeholder="请输入是否需要跟新项目" />
        </el-form-item>
        <el-form-item label="ai翻译后的readme文件" prop="aiReadmePath">
          <el-input v-model="form.aiReadmePath" placeholder="请输入ai翻译后的readme文件" />
        </el-form-item>
        <el-form-item label="仓库价值" prop="repValue">
          <el-input v-model="form.repValue" placeholder="请输入仓库价值" />
        </el-form-item>
        <el-form-item label="仓库推广文章" prop="promotionArticle">
          <el-input v-model="form.promotionArticle" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="Trending">
import { listTrending, getTrending, delTrending, addTrending, updateTrending } from "@/api/github/trending";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const trendingRef = ref();
const queryRef = ref();

const trendingList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeFirstTrendingDate = ref([]);
const daterangeLastTrendingDate = ref([]);
const daterangeUpdatedAt = ref([]);
const daterangeGithubCreatedAt = ref([]);
const daterangeGithubUpdatedAt = ref([]);
const daterangeReadmeUpdatedAt = ref([]);
const daterangeCreatedAt = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    owner: null,
    url: null,
    language: null,
    trendingDays: null,
    continuousTrendingDays: null,
    firstTrendingDate: null,
    lastTrendingDate: null,
  },
  rules: {
    id: [
      { required: true, message: "不能为空", trigger: "blur" }
    ],
    title: [
      { required: true, message: "仓库标题不能为空", trigger: "blur" }
    ],
    owner: [
      { required: true, message: "仓库作者不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "仓库地址不能为空", trigger: "blur" }
    ],
    isTranDes: [
      { required: true, message: "是否翻译描述不能为空", trigger: "blur" }
    ],
    updateAt: [
      { required: true, message: "修改时间不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询github流行榜单列表 */
async function getList() {
  loading.value = true;
  try {
    if (daterangeFirstTrendingDate.value && daterangeFirstTrendingDate.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginFirstTrendingDate: daterangeFirstTrendingDate.value[0],
        endFirstTrendingDate: daterangeFirstTrendingDate.value[1]
      };
    }
    if (daterangeLastTrendingDate.value && daterangeLastTrendingDate.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginLastTrendingDate: daterangeLastTrendingDate.value[0],
        endLastTrendingDate: daterangeLastTrendingDate.value[1]
      };
    }
    if (daterangeUpdatedAt.value && daterangeUpdatedAt.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginUpdatedAt: daterangeUpdatedAt.value[0],
        endUpdatedAt: daterangeUpdatedAt.value[1]
      };
    }
    if (daterangeGithubCreatedAt.value && daterangeGithubCreatedAt.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginGithubCreatedAt: daterangeGithubCreatedAt.value[0],
        endGithubCreatedAt: daterangeGithubCreatedAt.value[1]
      };
    }
    if (daterangeGithubUpdatedAt.value && daterangeGithubUpdatedAt.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginGithubUpdatedAt: daterangeGithubUpdatedAt.value[0],
        endGithubUpdatedAt: daterangeGithubUpdatedAt.value[1]
      };
    }
    if (daterangeReadmeUpdatedAt.value && daterangeReadmeUpdatedAt.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginReadmeUpdatedAt: daterangeReadmeUpdatedAt.value[0],
        endReadmeUpdatedAt: daterangeReadmeUpdatedAt.value[1]
      };
    }
    if (daterangeCreatedAt.value && daterangeCreatedAt.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginCreatedAt: daterangeCreatedAt.value[0],
        endCreatedAt: daterangeCreatedAt.value[1]
      };
    }
    const response = await listTrending(queryParams.value);
    trendingList.value = response.rows;
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
    title: null,
    owner: null,
    description: null,
    url: null,
    language: null,
    trendingDays: null,
    continuousTrendingDays: null,
    firstTrendingDate: null,
    lastTrendingDate: null,
    updatedAt: null,
    isTranDes: null,
    starsCount: null,
    forksCount: null,
    openIssuesCount: null,
    githubCreatedAt: null,
    githubUpdatedAt: null,
    readmePath: null,
    readmeUpdatedAt: null,
    createdAt: null,
    updateAt: null,
    isNeedUpdate: null,
    aiReadmePath: null,
    repValue: null,
    promotionArticle: null,
    remark: null,
    updateTime: null,
    updateBy: null,
    createTime: null,
    createBy: null
  };
  if (trendingRef.value) {
    trendingRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeFirstTrendingDate.value = [];
  daterangeLastTrendingDate.value = [];
  daterangeUpdatedAt.value = [];
  daterangeGithubCreatedAt.value = [];
  daterangeGithubUpdatedAt.value = [];
  daterangeReadmeUpdatedAt.value = [];
  daterangeCreatedAt.value = [];
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
function handleAdd() {
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加github流行榜单";
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
    const response = await getTrending(editId);
    form.value = response;
    open.value = true;
    title.value = "修改github流行榜单";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await trendingRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.id != null) {
      await updateTrending(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addTrending(form.value);
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
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delTrending(deleteIds);
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
  proxy.download('github/trending/export', {
    ...queryParams.value
  }, 'trending_' + new Date().getTime() + '.xlsx')
}

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  // 确保所有加载状态被重置，防止内存泄漏
  loading.value = false;
  formLoading.value = false;
});
</script>

