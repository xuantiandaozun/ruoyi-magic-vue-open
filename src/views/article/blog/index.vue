<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="博客标题" prop="title" class="search-item">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入博客标题"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="博客分类" prop="category" class="search-item">
        <el-input
          v-model="queryParams.category"
          placeholder="请输入博客分类"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="博客标签" prop="tags" class="search-item">
        <el-input
          v-model="queryParams.tags"
          placeholder="请输入博客标签，多个用逗号分隔"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否置顶" prop="isTop" class="search-item">
        <el-input
          v-model="queryParams.isTop"
          placeholder="请输入是否置顶"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>


      <el-form-item label="飞书同步状态" prop="feishuSyncStatus" class="search-item">
        <el-select v-model="queryParams.feishuSyncStatus" placeholder="请选择飞书同步状态" clearable>
          <el-option
            v-for="dict in feishu_sync_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
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
          @click="handleAdd"
          v-hasPermi="['article:blog:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Magic"
          @click="handleAiPolish"
          v-hasPermi="['article:blog:add']"
        >AI润色博客</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Picture"
          @click="handleAutoImage"
          v-hasPermi="['article:blog:add']"
        >自动配图</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Search"
          :disabled="single"
          @click="handleSeoOptimize"
          v-hasPermi="['article:blog:edit']"
        >SEO优化</el-button>
      </el-col>

      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['article:blog:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['article:blog:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['article:blog:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="blogList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="博客标题" align="center" prop="title" show-overflow-tooltip />
      <el-table-column label="博客摘要" align="center" prop="summary" show-overflow-tooltip width="200" />
      <el-table-column label="封面图片" align="center" prop="coverImage" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.coverImage" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="category" />
      <el-table-column label="标签" align="center" prop="tags" show-overflow-tooltip />
      <el-table-column label="置顶" align="center" prop="isTop" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.isTop == 1" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="原创" align="center" prop="isOriginal" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.isOriginal == 1" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="publishTime" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.publishTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="飞书同步" align="center" prop="feishuSyncStatus" width="100">
        <template #default="scope">
          <dict-tag :options="feishu_sync_status" :value="scope.row.feishuSyncStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['article:blog:edit']">修改</el-button>
          <el-button link type="success" icon="EditPen" @click="handleEditContent(scope.row)" v-hasPermi="['article:blog:edit']">编辑内容</el-button>
          <el-button link type="warning" icon="Search" @click="handleSeoOptimize(scope.row)" v-hasPermi="['article:blog:edit']">SEO优化</el-button>

          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['article:blog:remove']">删除</el-button>
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

    <!-- 添加或修改文章列表对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="blogRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="博客标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入博客标题" />
        </el-form-item>
        <el-form-item label="博客摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" placeholder="请输入博客摘要" :rows="3" />
        </el-form-item>
        <el-form-item label="封面图片" prop="coverImage">
          <image-upload v-model="form.coverImage"/>
        </el-form-item>
        <el-form-item label="博客分类" prop="category">
          <el-input v-model="form.category" placeholder="请输入博客分类" />
        </el-form-item>
        <el-form-item label="博客标签" prop="tags">
          <el-input v-model="form.tags" placeholder="请输入博客标签，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="是否置顶" prop="isTop">
          <el-radio-group v-model="form.isTop">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否原创" prop="isOriginal">
          <el-radio-group v-model="form.isOriginal">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发布时间" prop="publishTime">
          <el-date-picker clearable
            v-model="form.publishTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择发布时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="关联飞书文档" prop="feishuDocToken">
          <el-select v-model="form.feishuDocToken" placeholder="请选择关联的飞书文档" clearable filterable @change="handleFeishuDocChange">
            <el-option
              v-for="doc in feishuDocList"
              :key="doc.token"
              :label="doc.name"
              :value="doc.token"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" :rows="2" />
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

    <!-- AI润色博客对话框 -->
    <el-dialog title="AI润色博客" v-model="aiPolishOpen" width="80%" :style="{maxWidth: '1200px'}" append-to-body>
      <el-form ref="aiPolishRef" :model="aiPolishForm" :rules="aiPolishRules" label-width="100px">
        <el-form-item label="原始内容" prop="content">
          <el-input
            v-model="aiPolishForm.content"
            type="textarea"
            placeholder="请输入原始内容，支持文档、技术框架用法、脚本代码等各种类型内容"
            :rows="20"
            maxlength="30000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAiPolish">取 消</el-button>
          <el-button type="primary" @click="submitAiPolish" :loading="aiPolishLoading">提交润色</el-button>
        </div>
      </template>
    </el-dialog>


  </div>
</template>

<script setup name="Blog">
import { addBlog, delBlog, generateAiImage, getBlog, getFeishuDocOptions, listBlog, polishBlog, seoBlog, updateBlog } from "@/api/article/blog";
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';

const { proxy } = getCurrentInstance();
const router = useRouter();
// 模板引用
const blogRef = ref();
const queryRef = ref();
const { feishu_sync_status } = proxy.useDict('feishu_sync_status');

const blogList = ref([]);
const feishuDocList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const autoImageLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangePublishTime = ref([]);

// AI润色相关数据
const aiPolishOpen = ref(false);
const aiPolishLoading = ref(false);
const aiPolishRef = ref();
const aiPolishForm = ref({
  content: ''
});
const aiPolishRules = ref({
  content: [
    { required: true, message: "原始内容不能为空", trigger: "blur" },
    { min: 10, message: "内容长度至少10个字符", trigger: "blur" }
  ]
});

// SEO优化相关数据
const seoOptimizeLoading = ref(false);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    summary: null,
    content: null,
    coverImage: null,
    category: null,
    tags: null,
    status: null,
    isTop: null,
    isOriginal: null,
    viewCount: null,
    likeCount: null,
    publishTime: null,
    feishuSyncStatus: null,
  },
  rules: {
    title: [
      { required: true, message: "博客标题不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询文章列表列表 */
async function getList() {
  loading.value = true;
  try {
    if (daterangePublishTime.value && daterangePublishTime.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginPublishTime: daterangePublishTime.value[0],
        endPublishTime: daterangePublishTime.value[1]
      };
    }
    const response = await listBlog(queryParams.value);
    blogList.value = response.rows;
    total.value = response.total;
  } catch (error) {
    proxy.$modal.msgError("获取列表失败：" + error);
  } finally {
    loading.value = false;
  }
}

/** 获取飞书文档列表 */
async function getFeishuDocList() {
  try {
    const response = await getFeishuDocOptions();
    feishuDocList.value = response || [];
  } catch (error) {
    console.error("获取飞书文档列表失败：", error);
  }
}

/** 处理飞书文档选择变化 */
function handleFeishuDocChange(token) {
  if (token) {
    const selectedDoc = feishuDocList.value.find(doc => doc.token === token);
    if (selectedDoc) {
      form.value.feishuDocName = selectedDoc.name;
    }
  } else {
    form.value.feishuDocName = null;
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
    blogId: null,
    title: null,
    summary: null,
    content: null,
    coverImage: null,
    category: null,
    tags: null,
    status: null,
    isTop: null,
    isOriginal: null,
    viewCount: null,
    likeCount: null,
    commentCount: null,
    publishTime: null,
    feishuDocToken: null,
    feishuDocName: null,
    feishuSyncStatus: null,
    feishuLastSyncTime: null,
    sortOrder: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  };
  if (blogRef.value) {
    blogRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangePublishTime.value = [];
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.blogId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    getFeishuDocList(); // 获取飞书文档列表
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加文章列表";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.blogId || ids.value[0];
  formLoading.value = true;
  try {
    await getFeishuDocList(); // 获取飞书文档列表
    const response = await getBlog(editId);
    form.value = response;
    open.value = true;
    title.value = "修改文章列表";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 编辑内容按钮操作 */
function handleEditContent(row) {
  // 跳转到MD编辑器页面，传递博客ID
  router.push({
    path: '/article/blog/editor/index',
    query: {
      blogId: row.blogId,
      title: row.title
    }
  });
}

/** 提交按钮 */
async function submitForm() {
  try {
    await blogRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.blogId != null) {
      await updateBlog(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addBlog(form.value);
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
  const deleteIds = row.blogId || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delBlog(deleteIds);
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
  proxy.download('article/blog/export', {
    ...queryParams.value
  }, 'blog_' + new Date().getTime() + '.xlsx')
}

/** 自动配图按钮操作 */
async function handleAutoImage() {
  autoImageLoading.value = true;
  try {
    const response = await generateAiImage();
    if (response.success) {
      proxy.$modal.msgSuccess(response.message || "自动配图任务已开始处理，图片将在后台生成");
      // 刷新列表以显示可能的新图片
      setTimeout(() => {
        getList();
      }, 2000);
    } else {
      proxy.$modal.msgError(response.message || "自动配图失败");
    }
  } catch (error) {
    proxy.$modal.msgError("自动配图失败：" + (error.message || error));
  } finally {
    autoImageLoading.value = false;
  }
}

/** AI润色博客按钮操作 */
function handleAiPolish() {
  aiPolishForm.value.content = '';
  aiPolishOpen.value = true;
}

/** 取消AI润色 */
function cancelAiPolish() {
  aiPolishOpen.value = false;
  aiPolishForm.value.content = '';
  if (aiPolishRef.value) {
    aiPolishRef.value.resetFields();
  }
}

/** 提交AI润色 */
async function submitAiPolish() {
  try {
    await aiPolishRef.value.validate();
  } catch (error) {
    return;
  }

  aiPolishLoading.value = true;
  try {
    const response = await polishBlog({
      content: aiPolishForm.value.content
    });
    
    if (response.success) {
      proxy.$modal.msgSuccess(response.message || 'AI润色任务已开始处理，博客将在后台生成');
      aiPolishOpen.value = false;
      aiPolishForm.value.content = '';
      // 刷新列表以显示可能的新博客
      setTimeout(() => {
        getList();
      }, 2000);
    } else {
      proxy.$modal.msgError(response.message || 'AI润色失败');
    }
  } catch (error) {
    proxy.$modal.msgError('AI润色失败：' + (error.message || error));
  } finally {
    aiPolishLoading.value = false;
  }
}

/** SEO优化按钮操作 */
async function handleSeoOptimize(row) {
  const blogId = row ? row.blogId : ids.value[0];
  if (!blogId) {
    proxy.$modal.msgError('请选择要优化的博客');
    return;
  }

  seoOptimizeLoading.value = true;
  try {
    const response = await seoBlog({ blogId });
    proxy.$modal.msgSuccess('SEO优化完成，博客内容已自动更新');
    getList(); // 刷新列表
  } catch (error) {
    proxy.$modal.msgError('SEO优化失败：' + (error.message || error));
  } finally {
    seoOptimizeLoading.value = false;
  }
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
.flexible-search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.search-item {
  flex: 0 0 auto;
  min-width: 200px;
}

.search-buttons {
  flex: 0 0 auto;
  margin-left: auto;
}

.custom-dialog .el-dialog__body {
  padding: 20px;
}

.dialog-form .el-form-item {
  margin-bottom: 18px;
}

.dialog-footer {
  text-align: right;
}
</style>

