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

    <!-- 批量选择工具栏 -->
    <div v-if="selectedItems.length > 0" class="selection-toolbar">
      <el-alert
        :title="`已选择 ${selectedItems.length} 项`"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #default>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>已选择 {{ selectedItems.length }} 项</span>
            <el-button size="small" @click="clearSelection">清空选择</el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 卡片列表 -->
    <div v-loading="loading" class="card-container">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-for="item in trendingList" :key="item.id">
          <el-card class="trending-card" shadow="hover">
            <!-- 卡片头部：选择框和操作按钮 -->
            <template #header>
              <div class="card-header">
                <el-checkbox 
                  :model-value="selectedItems.includes(item.id)"
                  @change="handleItemSelection(item.id, $event)"
                />
                <div class="card-actions">
                  <el-button 
                    link 
                    type="primary" 
                    icon="Edit" 
                    @click="handleUpdate(item)" 
                    v-hasPermi="['github:trending:edit']"
                    size="small"
                  >修改</el-button>
                  <el-button 
                    link 
                    type="danger" 
                    icon="Delete" 
                    @click="handleDelete(item)" 
                    v-hasPermi="['github:trending:remove']"
                    size="small"
                  >删除</el-button>
                </div>
              </div>
            </template>

            <!-- 卡片内容 -->
            <div class="card-content">
              <!-- 仓库标题 -->
              <div class="field-item title-field">
                <h3 class="repo-title">
                  <a 
                    v-if="item.url" 
                    :href="item.url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="repo-link"
                  >
                    {{ item.title }}
                    <el-icon class="external-link-icon"><Link /></el-icon>
                  </a>
                  <span v-else>{{ item.title }}</span>
                </h3>
              </div>

              <!-- 仓库作者 -->
              <div class="field-item">
                <span class="field-label">作者：</span>
                <span class="field-value">{{ item.owner }}</span>
              </div>

              <!-- 仓库描述 -->
              <div class="field-item description-field">
                <span class="field-label">描述：</span>
                <div class="description-content">
                  <el-tooltip 
                    v-if="item.description && item.description.length > 100"
                    :content="item.description"
                    placement="top"
                    :show-after="500"
                  >
                    <p class="description-text">{{ item.description }}</p>
                  </el-tooltip>
                  <p v-else class="description-text">{{ item.description || '暂无描述' }}</p>
                </div>
              </div>

              <!-- 仓库语言 -->
              <div class="field-item">
                <span class="field-label">语言：</span>
                <el-tag v-if="item.language" size="small" type="info">{{ item.language }}</el-tag>
                <span v-else class="field-value">-</span>
              </div>

              <!-- 统计信息 -->
              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-label">总上榜天数</span>
                  <span class="stat-value">{{ item.trendingDays || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">连续上榜</span>
                  <span class="stat-value">{{ item.continuousTrendingDays || 0 }}</span>
                </div>
              </div>

              <!-- GitHub 统计 -->
              <div class="github-stats">
                <div class="github-stat">
                  <el-icon><Star /></el-icon>
                  <span>{{ item.starsCount || 0 }}</span>
                </div>
                <div class="github-stat">
                  <el-icon><Share /></el-icon>
                  <span>{{ item.forksCount || 0 }}</span>
                </div>
              </div>

              <!-- README 预览 -->
              <div v-if="item.readmePath || item.aiReadmePath" class="readme-section">
                <div class="readme-buttons">
                  <el-button 
                    v-if="item.readmePath"
                    size="small" 
                    type="primary" 
                    plain
                    @click="previewReadme(item.readmePath, '原版 README')"
                    icon="Document"
                  >
                    原版 README
                  </el-button>
                  <el-button 
                    v-if="item.aiReadmePath"
                    size="small" 
                    type="success" 
                    plain
                    @click="previewReadme(item.aiReadmePath, 'AI翻译 README')"
                    icon="Magic"
                  >
                    AI翻译 README
                  </el-button>
                </div>
              </div>

              <!-- 最后更新时间 -->
              <div class="field-item update-time">
                <span class="field-label">最后更新：</span>
                <span class="field-value">{{ parseTime(item.githubUpdatedAt, '{y}-{m}-{d}') }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!loading && trendingList.length === 0" description="暂无数据" />
    </div>
    
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

    <!-- README 预览对话框 -->
    <el-dialog 
      v-model="readmePreviewOpen" 
      :title="readmePreviewTitle"
      width="80%"
      :style="{maxWidth: '1200px'}"
      append-to-body
      class="readme-preview-dialog"
    >
      <div v-loading="readmeLoading" class="readme-content">
        <div v-if="readmeContent" class="markdown-body" v-html="readmeContent"></div>
        <el-empty v-else description="无法加载README内容" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="readmePreviewOpen = false">关闭</el-button>
          <el-button type="primary" @click="downloadReadme" v-if="currentReadmeUrl">下载文件</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Trending">
import { listTrending, getTrending, delTrending, addTrending, updateTrending } from "@/api/github/trending";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';
import { Star, Share, Link } from '@element-plus/icons-vue';

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
const selectedItems = ref([]);
const title = ref("");
const readmePreviewOpen = ref(false);
const readmePreviewTitle = ref("");
const readmeContent = ref("");
const readmeLoading = ref(false);
const currentReadmeUrl = ref("");
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

// 处理单个卡片的选择
function handleItemSelection(itemId, checked) {
  if (checked) {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId);
    }
  } else {
    const index = selectedItems.value.indexOf(itemId);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    }
  }
  
  // 更新ids、single、multiple状态以保持与原有逻辑兼容
  ids.value = selectedItems.value;
  single.value = selectedItems.value.length !== 1;
  multiple.value = selectedItems.value.length === 0;
}

// 清空选择
function clearSelection() {
  selectedItems.value = [];
  ids.value = [];
  single.value = true;
  multiple.value = true;
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

/** README 预览功能 */
async function previewReadme(readmeUrl, title) {
  if (!readmeUrl) {
    proxy.$modal.msgWarning('README文件路径不存在');
    return;
  }
  
  readmePreviewTitle.value = title;
  currentReadmeUrl.value = readmeUrl;
  readmePreviewOpen.value = true;
  readmeLoading.value = true;
  readmeContent.value = '';
  
  try {
    const response = await fetch(readmeUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    readmeContent.value = convertMarkdownToHtml(text);
  } catch (error) {
    console.error('加载README失败:', error);
    proxy.$modal.msgError('加载README文件失败，可能是网络问题或文件不存在');
    readmeContent.value = '加载失败';
  } finally {
    readmeLoading.value = false;
  }
}

/** 简单的Markdown转HTML */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // 代码块
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // 行内代码
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // 换行
    .replace(/\n/gim, '<br>');
    
  return html;
}

/** 下载README文件 */
function downloadReadme() {
  if (!currentReadmeUrl.value) {
    proxy.$modal.msgWarning('文件地址不存在');
    return;
  }
  
  // 创建一个临时的a标签来触发下载
  const link = document.createElement('a');
  link.href = currentReadmeUrl.value;
  link.download = `${readmePreviewTitle.value}.md`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 在组件卸载前清理资源
onUnmounted(() => {
  // 确保所有加载状态被重置，防止内存泄漏
  loading.value = false;
  formLoading.value = false;
  readmeLoading.value = false;
});
</script>

<style scoped>
.card-container {
  margin-top: 16px;
}

.el-row {
  margin-bottom: -4px;
}

.el-col {
  margin-bottom: 4px;
}

.trending-card {
  margin-bottom: 20px;
  height: 100%;
  transition: all 0.3s ease;
}

.trending-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  padding: 0;
}

.field-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.field-item:last-child {
  margin-bottom: 0;
}

.title-field {
  margin-bottom: 16px;
  display: block;
}

.repo-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  line-height: 1.4;
  word-break: break-word;
}

.field-label {
  font-weight: 500;
  color: #606266;
  min-width: 60px;
  flex-shrink: 0;
}

.field-value {
  color: #303133;
  word-break: break-word;
}

.description-field {
  align-items: flex-start;
  margin-bottom: 16px;
}

.description-content {
  flex: 1;
  min-width: 0;
}

.description-text {
  margin: 0;
  line-height: 1.5;
  color: #606266;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.description-text:hover {
  color: #409eff;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.github-stats {
  display: flex;
  gap: 16px;
  margin: 12px 0;
}

.github-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
}

.github-stat .el-icon {
  color: #f39c12;
}

.update-time {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
}

.update-time .field-label,
.update-time .field-value {
  color: #909399;
}

.selection-toolbar {
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .github-stats {
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .card-actions {
    align-self: flex-end;
  }
}

/* 确保卡片等高 */
.el-row .el-col {
  display: flex;
}

.el-row .el-col .trending-card {
  width: 100%;
}

/* 仓库链接样式 */
.repo-link {
  color: #409eff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.repo-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.external-link-icon {
  font-size: 14px;
  opacity: 0.7;
}

/* README 预览区域 */
.readme-section {
  margin: 16px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.readme-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* README 预览对话框 */
.readme-preview-dialog .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.readme-content {
  min-height: 200px;
}

.markdown-body {
  line-height: 1.6;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 10px;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body code {
  background-color: #f6f8fa;
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  font-size: 85%;
  line-height: 1.45;
  overflow: auto;
  padding: 16px;
}

.markdown-body pre code {
  background-color: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  max-width: auto;
  overflow: visible;
  padding: 0;
  word-wrap: normal;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body strong {
  font-weight: 600;
}

.markdown-body em {
  font-style: italic;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .readme-buttons {
    flex-direction: column;
  }
  
  .readme-buttons .el-button {
    width: 100%;
  }
  
  .readme-preview-dialog {
    width: 95% !important;
  }
}
</style>

