<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="博客名称" prop="blogName" class="search-item">
        <el-input
          v-model="queryParams.blogName"
          placeholder="请输入博客名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" class="search-item date-range-item">
        <el-date-picker
          v-model="daterangeCreateTime"
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
          v-hasPermi="['article:socialArticle:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['article:socialArticle:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['article:socialArticle:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['article:socialArticle:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedArticles.length > 0" class="batch-toolbar">
      <el-alert
        :title="`已选择 ${selectedArticles.length} 篇文章`"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #default>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>已选择 {{ selectedArticles.length }} 篇文章</span>
            <el-button size="small" @click="clearSelection">清除选择</el-button>
            <el-button 
              size="small" 
              type="danger" 
              :disabled="selectedArticles.length === 0"
              @click="handleBatchDelete"
              v-hasPermi="['article:socialArticle:remove']"
            >
              批量删除
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 卡片式布局 -->
    <div v-loading="loading" class="article-cards">
      <div 
        v-for="article in socialArticleList" 
        :key="article.articleId"
        class="article-card"
        :class="{ 'selected': selectedArticles.includes(article.articleId) }"
        @click="toggleSelection(article)"
      >
        <!-- 选择框 -->
        <div class="card-checkbox">
          <el-checkbox 
            :model-value="selectedArticles.includes(article.articleId)"
            @change="toggleSelection(article)"
            @click.stop
          />
        </div>

        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="card-title">
            <h3>{{ article.titleZh || '无标题' }}</h3>
            <p class="english-title">{{ article.titleEn }}</p>
          </div>
          <div class="card-actions">
            <el-button 
              size="small" 
              type="primary" 
              icon="Edit" 
              @click.stop="handleUpdate(article)" 
              v-hasPermi="['article:socialArticle:edit']"
            >
              修改
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              icon="Delete" 
              @click.stop="handleDelete(article)" 
              v-hasPermi="['article:socialArticle:remove']"
            >
              删除
            </el-button>
          </div>
        </div>

        <!-- 卡片内容 -->
         <div class="card-content">
           <div class="content-columns">
             <!-- 左侧中文内容 -->
             <div class="content-column chinese-content">
               <h4 class="column-title">中文版本</h4>
               
               <div class="content-section">
                 <label>摘要：</label>
                 <div class="content-text">
                   <span>{{ article.summaryZh || '暂无摘要' }}</span>
                   <el-button 
                     v-if="article.summaryZh"
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.summaryZh, '中文摘要')"
                     title="复制中文摘要"
                   />
                 </div>
               </div>

               <div class="content-section">
                 <label>内容：</label>
                 <div class="content-text">
                   <span class="content-preview">{{ getContentPreview(article.contentZh) }}</span>
                   <el-button 
                     v-if="article.contentZh"
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.contentZh, '中文内容')"
                     title="复制中文内容"
                   />
                 </div>
               </div>

               <div class="content-section" v-if="article.keywordsZh">
                 <label>关键词：</label>
                 <div class="content-text">
                   <span>{{ article.keywordsZh }}</span>
                   <el-button 
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.keywordsZh, '中文关键词')"
                     title="复制中文关键词"
                   />
                 </div>
               </div>
             </div>

             <!-- 右侧英文内容 -->
             <div class="content-column english-content">
               <h4 class="column-title">English Version</h4>
               
               <div class="content-section">
                 <label>Summary：</label>
                 <div class="content-text">
                   <span>{{ article.summaryEn || 'No summary' }}</span>
                   <el-button 
                     v-if="article.summaryEn"
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.summaryEn, '英文摘要')"
                     title="复制英文摘要"
                   />
                 </div>
               </div>

               <div class="content-section">
                 <label>Content：</label>
                 <div class="content-text">
                   <span class="content-preview">{{ getContentPreview(article.contentEn) }}</span>
                   <el-button 
                     v-if="article.contentEn"
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.contentEn, '英文内容')"
                     title="复制英文内容"
                   />
                 </div>
               </div>

               <div class="content-section" v-if="article.keywordsEn">
                 <label>Keywords：</label>
                 <div class="content-text">
                   <span>{{ article.keywordsEn }}</span>
                   <el-button 
                     size="small" 
                     type="text" 
                     icon="CopyDocument" 
                     @click.stop="copyToClipboard(article.keywordsEn, '英文关键词')"
                     title="复制英文关键词"
                   />
                 </div>
               </div>
             </div>
           </div>
         </div>

        <!-- 卡片底部信息 -->
        <div class="card-footer">
          <div class="meta-info">
            <el-tag v-if="article.articleType" size="small" type="info">{{ article.articleType }}</el-tag>
            <el-tag 
              v-if="article.publishStatus !== null" 
              size="small" 
              :type="getStatusType(article.publishStatus)"
            >
              {{ getStatusText(article.publishStatus) }}
            </el-tag>
            <span v-if="article.blogName" class="blog-name">{{ article.blogName }}</span>
          </div>
          <div class="time-info">
            <span>{{ parseTime(article.createTime, '{y}-{m}-{d}') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && socialArticleList.length === 0" description="暂无数据" />
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改自媒体文章对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="socialArticleRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="中文标题" prop="titleZh">
          <el-input v-model="form.titleZh" placeholder="请输入中文标题" />
        </el-form-item>
        <el-form-item label="英文标题" prop="titleEn">
          <el-input v-model="form.titleEn" placeholder="请输入英文标题" />
        </el-form-item>
        <el-form-item label="中文摘要/微头条内容" prop="summaryZh">
          <el-input v-model="form.summaryZh" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="英文摘要/Twitter内容" prop="summaryEn">
          <el-input v-model="form.summaryEn" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="中文完整内容" prop="contentZh">
          <el-input v-model="form.contentZh" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="英文完整内容" prop="contentEn">
          <el-input v-model="form.contentEn" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="中文关键词" prop="keywordsZh">
          <el-input v-model="form.keywordsZh" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="英文关键词" prop="keywordsEn">
          <el-input v-model="form.keywordsEn" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="内容角度" prop="contentAngle">
          <el-input v-model="form.contentAngle" placeholder="请输入内容角度" />
        </el-form-item>
        <el-form-item label="目标平台(toutiao-今日头条,twitter-推特,medium-Medium等)" prop="targetPlatform">
          <el-input v-model="form.targetPlatform" placeholder="请输入目标平台(toutiao-今日头条,twitter-推特,medium-Medium等)" />
        </el-form-item>
        <el-form-item label="关联的博客文章ID列表(逗号分隔)" prop="relatedBlogIds">
          <el-input v-model="form.relatedBlogIds" placeholder="请输入关联的博客文章ID列表(逗号分隔)" />
        </el-form-item>
        <el-form-item label="生成日期" prop="generationDate">
          <el-date-picker clearable
            v-model="form.generationDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择生成日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="博客名称" prop="blogName">
          <el-input v-model="form.blogName" placeholder="请输入博客名称" />
        </el-form-item>
        <el-form-item label="阅读量" prop="viewCount">
          <el-input v-model="form.viewCount" placeholder="请输入阅读量" />
        </el-form-item>
        <el-form-item label="点赞数" prop="likeCount">
          <el-input v-model="form.likeCount" placeholder="请输入点赞数" />
        </el-form-item>
        <el-form-item label="分享数" prop="shareCount">
          <el-input v-model="form.shareCount" placeholder="请输入分享数" />
        </el-form-item>
        <el-form-item label="评论数" prop="commentCount">
          <el-input v-model="form.commentCount" placeholder="请输入评论数" />
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

<script setup name="SocialArticle">
import { listSocialArticle, getSocialArticle, delSocialArticle, addSocialArticle, updateSocialArticle } from "@/api/article/socialArticle";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const socialArticleRef = ref();
const queryRef = ref();

const socialArticleList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeGenerationDate = ref([]);
const daterangeCreateTime = ref([]);
const daterangeUpdateTime = ref([]);
// 新增：卡片选择状态
const selectedArticles = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    articleType: null,
    publishStatus: null,
    blogName: null,
    createTime: null,
  },
  rules: {
    titleZh: [
      { required: true, message: "中文标题不能为空", trigger: "blur" }
    ],
    articleType: [
      { required: true, message: "文章类型(GITHUB_RANKING-GitHub排行榜,PROJECT_ANALYSIS-项目分析等)不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询自媒体文章列表 */
async function getList() {
  loading.value = true;
  try {
    if (daterangeGenerationDate.value && daterangeGenerationDate.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginGenerationDate: daterangeGenerationDate.value[0],
        endGenerationDate: daterangeGenerationDate.value[1]
      };
    }
    if (daterangeCreateTime.value && daterangeCreateTime.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginCreateTime: daterangeCreateTime.value[0],
        endCreateTime: daterangeCreateTime.value[1]
      };
    }
    if (daterangeUpdateTime.value && daterangeUpdateTime.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginUpdateTime: daterangeUpdateTime.value[0],
        endUpdateTime: daterangeUpdateTime.value[1]
      };
    }
    const response = await listSocialArticle(queryParams.value);
    socialArticleList.value = response.rows;
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
    articleId: null,
    titleZh: null,
    titleEn: null,
    summaryZh: null,
    summaryEn: null,
    contentZh: null,
    contentEn: null,
    keywordsZh: null,
    keywordsEn: null,
    articleType: null,
    contentAngle: null,
    targetPlatform: null,
    publishStatus: null,
    sourceRepos: null,
    relatedBlogIds: null,
    generationDate: null,
    blogName: null,
    viewCount: null,
    likeCount: null,
    shareCount: null,
    commentCount: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  };
  if (socialArticleRef.value) {
    socialArticleRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeGenerationDate.value = [];
  daterangeCreateTime.value = [];
  daterangeUpdateTime.value = [];
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.articleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

// 新增：卡片选择管理
function toggleSelection(article) {
  const index = selectedArticles.value.indexOf(article.articleId);
  if (index > -1) {
    selectedArticles.value.splice(index, 1);
  } else {
    selectedArticles.value.push(article.articleId);
  }
  // 更新原有的选择状态
  ids.value = selectedArticles.value;
  single.value = selectedArticles.value.length !== 1;
  multiple.value = selectedArticles.value.length === 0;
}

// 清除选择
function clearSelection() {
  selectedArticles.value = [];
  ids.value = [];
  single.value = true;
  multiple.value = true;
}

// 批量删除
async function handleBatchDelete() {
  if (selectedArticles.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要删除的文章');
    return;
  }
  
  try {
    await proxy.$modal.confirm(`是否确认删除选中的 ${selectedArticles.value.length} 篇文章？`);
    await delSocialArticle(selectedArticles.value.join(','));
    clearSelection();
    getList();
    proxy.$modal.msgSuccess('批量删除成功');
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作，无需提示
    } else {
      proxy.$modal.msgError('批量删除失败：' + error);
    }
  }
}

// 复制到剪贴板
async function copyToClipboard(text, label) {
  if (!text) {
    proxy.$modal.msgWarning('内容为空，无法复制');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    proxy.$modal.msgSuccess(`${label}已复制到剪贴板`);
  } catch (error) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      proxy.$modal.msgSuccess(`${label}已复制到剪贴板`);
    } catch (fallbackError) {
      proxy.$modal.msgError('复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
  }
}

// 获取内容预览（截取前100个字符）
function getContentPreview(content) {
  if (!content) return '暂无内容';
  return content.length > 100 ? content.substring(0, 100) + '...' : content;
}

// 获取发布状态类型
function getStatusType(status) {
  switch (status) {
    case 0: return 'info';    // 草稿
    case 1: return 'success'; // 已发布
    case 2: return 'warning'; // 已下线
    default: return 'info';
  }
}

// 获取发布状态文本
function getStatusText(status) {
  switch (status) {
    case 0: return '草稿';
    case 1: return '已发布';
    case 2: return '已下线';
    default: return '未知';
  }
}

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加自媒体文章";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.articleId || ids.value[0];
  formLoading.value = true;
  try {
    const response = await getSocialArticle(editId);
    form.value = response;
    open.value = true;
    title.value = "修改自媒体文章";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await socialArticleRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.articleId != null) {
      await updateSocialArticle(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addSocialArticle(form.value);
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
  const deleteIds = row.articleId || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delSocialArticle(deleteIds);
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
  proxy.download('article/socialArticle/export', {
    ...queryParams.value
  }, 'socialArticle_' + new Date().getTime() + '.xlsx')
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

<style scoped>
/* 卡片容器 */
.article-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

/* 单个卡片 */
.article-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.article-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.article-card.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 选择框 */
.card-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  margin-left: 32px; /* 为选择框留出空间 */
}

.card-title h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  word-break: break-word;
}

.card-title .english-title {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 卡片内容 */
.card-content {
  margin-bottom: 16px;
}

/* 左右分栏布局 */
.content-columns {
  display: flex;
  gap: 24px;
}

.content-column {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.column-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.chinese-content .column-title {
  border-bottom-color: #67c23a;
  color: #67c23a;
}

.english-content .column-title {
  border-bottom-color: #409eff;
  color: #409eff;
}

.content-section {
  margin-bottom: 16px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-section label {
  display: block;
  font-weight: 500;
  color: #606266;
  font-size: 12px;
  margin-bottom: 6px;
}

.content-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.content-text span {
  flex: 1;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
  min-height: 20px;
}

.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.blog-name {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.time-info {
  font-size: 12px;
  color: #c0c4cc;
}

/* 批量操作工具栏 */
.batch-toolbar {
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .card-actions {
    justify-content: flex-end;
  }
  
  /* 移动端左右分栏改为上下布局 */
  .content-columns {
    flex-direction: column;
    gap: 20px;
  }
  
  .content-column {
    width: 100%;
  }
  
  .column-title {
    font-size: 13px;
    margin-bottom: 10px;
    padding-bottom: 6px;
  }
  
  .content-section {
    margin-bottom: 12px;
  }
  
  .content-text span {
    font-size: 12px;
  }
}

/* 复制按钮样式优化 */
.content-text .el-button {
  padding: 4px;
  min-height: auto;
  border: none;
  background: transparent;
  color: #909399;
  transition: color 0.3s ease;
}

.content-text .el-button:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

/* 空状态样式 */
.el-empty {
  padding: 60px 0;
}
</style>

