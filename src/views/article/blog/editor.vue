<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">{{ blogTitle || '博客内容编辑' }}</span>
          <div class="header-buttons">
            <el-button @click="handleBack">返回</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
          </div>
        </div>
      </template>
      
      <div v-loading="loading" class="editor-container">
        <div class="editor-header">
          <el-input 
            v-model="blogData.title" 
            placeholder="请输入博客标题"
            class="title-input"
            size="large"
          />
        </div>
        
        <div class="editor-content">
          <el-tabs v-model="activeTab" class="editor-tabs">
            <el-tab-pane label="编辑" name="edit">
              <div class="markdown-editor">
                <el-input
                  v-model="blogData.content"
                  type="textarea"
                  placeholder="请输入博客内容（支持Markdown语法）"
                  :rows="25"
                  class="content-textarea"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane label="预览" name="preview">
              <div class="markdown-preview" v-html="renderedContent"></div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="BlogEditor">
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBlog, updateBlog } from '@/api/article/blog';
import { marked } from 'marked';

const { proxy } = getCurrentInstance();
const route = useRoute();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const activeTab = ref('edit');
const blogTitle = ref('');

const blogData = reactive({
  blogId: null,
  title: '',
  content: '',
  summary: ''
});

// 计算属性：渲染Markdown内容
const renderedContent = computed(() => {
  if (!blogData.content) return '<p>暂无内容</p>';
  try {
    return marked(blogData.content);
  } catch (error) {
    return '<p>Markdown解析错误</p>';
  }
});

// 获取博客数据
async function loadBlogData() {
  const blogId = route.query.blogId;
  if (!blogId) {
    proxy.$modal.msgError('缺少博客ID参数');
    handleBack();
    return;
  }
  
  loading.value = true;
  try {
    const response = await getBlog(blogId);
    // 根据响应拦截器逻辑，response 已经是处理后的数据
    blogData.blogId = response.blogId;
    blogData.title = response.title || '';
    blogData.content = response.content || '';
    blogData.summary = response.summary || '';
    blogTitle.value = response.title || '博客内容编辑';
  } catch (error) {
    proxy.$modal.msgError('获取博客数据失败：' + error);
    handleBack();
  } finally {
    loading.value = false;
  }
}

// 保存博客内容
async function handleSave() {
  if (!blogData.title.trim()) {
    proxy.$modal.msgError('请输入博客标题');
    return;
  }
  
  saving.value = true;
  try {
    const updateData = {
      blogId: blogData.blogId,
      title: blogData.title,
      content: blogData.content,
      summary: blogData.summary
    };
    
    await updateBlog(updateData);
    proxy.$modal.msgSuccess('保存成功');
    blogTitle.value = blogData.title;
  } catch (error) {
    proxy.$modal.msgError('保存失败：' + error);
  } finally {
    saving.value = false;
  }
}

// 返回列表页
function handleBack() {
  // 先关闭当前标签页，然后跳转到列表页
  proxy.$tab.closeOpenPage('/blog/blog');
}

// 组件挂载时加载数据
onMounted(() => {
  loadBlogData();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.box-card {
  min-height: calc(100vh - 120px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.editor-container {
  min-height: 600px;
}

.editor-header {
  margin-bottom: 20px;
}

.title-input {
  font-size: 20px;
  font-weight: bold;
}

.title-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: bold;
  border: none;
  border-bottom: 2px solid #dcdfe6;
  border-radius: 0;
  padding-left: 0;
}

.title-input :deep(.el-input__inner:focus) {
  border-bottom-color: #409eff;
}

.editor-content {
  height: calc(100vh - 280px);
}

.editor-tabs {
  height: 100%;
}

.editor-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
}

.editor-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.markdown-editor {
  height: 100%;
}

.content-textarea {
  height: 100%;
}

.content-textarea :deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-preview {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background-color: #fafafa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #303133;
}

.markdown-preview :deep(p) {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #606266;
}

.markdown-preview :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-preview :deep(pre) {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin: 10px 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 15px 0;
  color: #909399;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin: 10px 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background-color: #f5f7fa;
  font-weight: bold;
}
</style>