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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            type="text"
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


  </div>
</template>

<script setup name="EnBlog">
import { listEnBlog, delEnBlog } from "@/api/article/enBlog";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

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

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  // 确保所有加载状态被重置，防止内存泄漏
  loading.value = false;
});
</script>

