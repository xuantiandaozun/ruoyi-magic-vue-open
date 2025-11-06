<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="英文博客标题" prop="title" class="search-item">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入英文博客标题"
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
        <el-select v-model="queryParams.isTop" placeholder="请选择是否置顶" clearable>
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
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
          type="warning"
          plain
          icon="Search"
          :disabled="single"
          :loading="seoOptimizeLoading"
          @click="handleSeoOptimize"
          v-hasPermi="['article:enBlog:edit']"
        >英文SEO优化</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['article:enBlog:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['article:enBlog:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="enBlogList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="英文博客标题" align="center" prop="title" show-overflow-tooltip />
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
      <el-table-column label="浏览次数" align="center" prop="viewCount" width="100" />
      <el-table-column label="点赞次数" align="center" prop="likeCount" width="100" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="250">
        <template #default="scope">
          <el-button link type="primary" icon="Picture" @click="handleSetCover(scope.row)" v-hasPermi="['article:enBlog:edit']">设置封面</el-button>
          <el-button link type="warning" icon="Search" @click="handleSeoOptimize(scope.row)" v-hasPermi="['article:enBlog:edit']">英文SEO优化</el-button>
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['article:enBlog:remove']"
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

    <!-- 设置封面对话框 -->
    <el-dialog 
      v-model="setCoverOpen" 
      title="设置封面"
      width="auto"
      :style="{minWidth: '300px', maxWidth: '90vw'}"
      append-to-body
      class="set-cover-dialog"
    >
      <!-- 搜索栏 -->
      <div class="cover-search-bar">
        <el-input
          v-model="coverSearchText"
          placeholder="搜索提示词..."
          clearable
          @input="handleCoverSearch"
          style="width: 100%; max-width: 300px;"
        />
      </div>

      <div v-loading="setCoverLoading" style="min-height: 200px;">
        <el-empty v-if="filteredCoverList.length === 0" description="暂无可用的封面" />
        <div v-else class="cover-grid">
          <div 
            v-for="cover in filteredCoverList" 
            :key="cover.id" 
            class="cover-item"
            :class="{ selected: selectedCoverId === cover.id }"
            @click="selectedCoverId = cover.id"
          >
            <img :src="cover.imageUrl" :alt="cover.prompt" class="cover-thumbnail" />
            <div class="cover-info">
              <p class="cover-prompt">{{ cover.prompt }}</p>
              <p class="cover-time">{{ parseTime(cover.generationTime, '{y}-{m}-{d} {h}:{i}') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="searchedCoverList.length > 0" class="cover-pagination">
        <el-pagination
          v-model:current-page="coverPageNum"
          v-model:page-size="coverPageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="searchedCoverList.length"
          layout="total, sizes, prev, pager, next"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="setCoverOpen = false">取 消</el-button>
          <el-button type="primary" @click="confirmSetCover" :disabled="!selectedCoverId">确 定</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup name="EnBlog">
import { listEnBlog, delEnBlog, seoEnBlog, updateEnBlog } from "@/api/article/enBlog";
import { listUnusedRecords } from "@/api/ai/coverGenerationRecord";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs, watch } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const queryRef = ref();

const enBlogList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const daterangePublishTime = ref([]);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);

// SEO优化相关数据
const seoOptimizeLoading = ref(false);

// 设置封面相关数据
const setCoverOpen = ref(false);
const setCoverLoading = ref(false);
const coverList = ref([]);
const currentEnBlogItem = ref(null);
const selectedCoverId = ref(null);
const coverSearchText = ref("");
const coverPageNum = ref(1);
const coverPageSize = ref(12);
const searchedCoverList = ref([]);
const filteredCoverList = ref([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    category: null,
    tags: null,
    isTop: null,
  }
});

const { queryParams } = toRefs(data);

/** 查询英文博客列表 */
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
    const response = await listEnBlog(queryParams.value);
    enBlogList.value = response.rows;
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
  daterangePublishTime.value = [];
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
  handleQuery();
}



/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.blogId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 删除按钮操作 */
function handleDelete(row) {
  const blogIds = row.blogId || ids.value;
  proxy.$modal.confirm('是否确认删除英文博客编号为"' + blogIds + '"的数据项？').then(function() {
    return delEnBlog(blogIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('article/enBlog/export', {
    ...queryParams.value
  }, 'enBlog_' + new Date().getTime() + '.xlsx')
}

/** 英文SEO优化按钮操作 */
async function handleSeoOptimize(row) {
  const blogId = row ? row.blogId : ids.value[0];
  if (!blogId) {
    proxy.$modal.msgError('请选择要优化的英文博客');
    return;
  }

  seoOptimizeLoading.value = true;
  try {
    const response = await seoEnBlog({ blogId });
    proxy.$modal.msgSuccess('英文SEO优化完成，博客内容已自动更新');
    getList(); // 刷新列表
  } catch (error) {
    proxy.$modal.msgError('英文SEO优化失败：' + (error.message || error));
  } finally {
    seoOptimizeLoading.value = false;
  }
}

/** 打开设置封面对话框 */
async function handleSetCover(item) {
  currentEnBlogItem.value = item;
  selectedCoverId.value = null;
  coverSearchText.value = "";
  coverPageNum.value = 1;
  coverPageSize.value = 12;
  setCoverOpen.value = true;
  setCoverLoading.value = true;
  
  try {
    const response = await listUnusedRecords();
    coverList.value = response;
    updateSearchedList();
    updateFilteredCoverList();
  } catch (error) {
    proxy.$modal.msgError("获取封面列表失败：" + error);
  } finally {
    setCoverLoading.value = false;
  }
}

/** 搜索封面 */
function handleCoverSearch() {
  coverPageNum.value = 1;
  updateSearchedList();
  updateFilteredCoverList();
}

/** 更新搜索结果列表 */
function updateSearchedList() {
  let searched = coverList.value;
  
  // 按搜索文本过滤
  if (coverSearchText.value.trim()) {
    const searchLower = coverSearchText.value.toLowerCase();
    searched = searched.filter(cover => 
      cover.prompt.toLowerCase().includes(searchLower)
    );
  }
  
  searchedCoverList.value = searched;
}

/** 更新过滤后的封面列表（分页） */
function updateFilteredCoverList() {
  const start = (coverPageNum.value - 1) * coverPageSize.value;
  const end = start + coverPageSize.value;
  filteredCoverList.value = searchedCoverList.value.slice(start, end);
}

/** 分页改变 */
function handleCoverPagination() {
  updateFilteredCoverList();
}

// 监听分页变量变化
watch([coverPageNum, coverPageSize], () => {
  updateFilteredCoverList();
});

/** 确认设置封面 */
async function confirmSetCover() {
  if (!currentEnBlogItem.value || !selectedCoverId.value) {
    proxy.$modal.msgWarning("请选择一个封面");
    return;
  }
  
  setCoverLoading.value = true;
  try {
    // 获取选中的封面信息
    const selectedCover = coverList.value.find(c => c.id === selectedCoverId.value);
    if (!selectedCover) {
      proxy.$modal.msgError("封面信息不存在");
      return;
    }
    
    // 更新英文博客的封面
    const updateData = {
      blogId: currentEnBlogItem.value.blogId,
      coverImage: selectedCover.imageUrl
    };
    
    await updateEnBlog(updateData);
    
    proxy.$modal.msgSuccess("设置封面成功");
    setCoverOpen.value = false;
    getList();
  } catch (error) {
    proxy.$modal.msgError("设置封面失败：" + error);
  } finally {
    setCoverLoading.value = false;
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
  seoOptimizeLoading.value = false;
  setCoverLoading.value = false;
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

/* 搜索栏 */
.cover-search-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

/* 分页 */
.cover-pagination {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.cover-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #f5f7fa;
}

.cover-item:hover {
  border-color: #409eff;
  transform: scale(1.02);
}

.cover-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.cover-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.cover-info {
  padding: 8px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.cover-prompt {
  margin: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.cover-time {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #909399;
}

@media (max-width: 768px) {
  .cover-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .cover-thumbnail {
    height: 120px;
  }
}
</style>
