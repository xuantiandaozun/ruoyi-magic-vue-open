<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="平台" prop="platform" class="search-item">
        <el-select
          v-model="queryParams.platform"
          placeholder="请选择平台"
          clearable
          class="search-input"
        >
          <el-option label="今日头条" value="toutiao" />
          <el-option label="抖音" value="douyin" />
          <el-option label="B站" value="bilibili" />
          <el-option label="微博" value="weibo" />
          <el-option label="Twitter" value="twitter" />
          <el-option label="Medium" value="medium" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容类型" prop="contentType" class="search-item">
        <el-select
          v-model="queryParams.contentType"
          placeholder="请选择内容类型"
          clearable
          class="search-input"
        >
          <el-option label="文章" value="article" />
          <el-option label="视频" value="video" />
          <el-option label="图集" value="image_set" />
          <el-option label="音频" value="audio" />
          <el-option label="短文" value="short_post" />
          <el-option label="直播回放" value="live_replay" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status" class="search-item">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="search-input"
        >
          <el-option label="可用" value="active" />
          <el-option label="归档" value="archived" />
          <el-option label="失效" value="invalid" />
        </el-select>
      </el-form-item>
      <el-form-item label="质量等级" prop="qualityLevel" class="search-item">
        <el-select
          v-model="queryParams.qualityLevel"
          placeholder="请选择质量等级"
          clearable
          class="search-input"
        >
          <el-option label="优" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>
      <el-form-item label="采集时间" class="search-item date-range-item">
        <el-date-picker
          v-model="daterangeCaptureTime"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="标题/作者" prop="keyword" class="search-item">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入标题或作者"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="search-buttons">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['article:social-media-asset:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['article:social-media-asset:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['article:social-media-asset:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['article:social-media-asset:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedAssets.length > 0" class="batch-toolbar">
      <el-alert
        :title="`已选择 ${selectedAssets.length} 条素材`"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #default>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>已选择 {{ selectedAssets.length }} 条素材</span>
            <el-button size="small" @click="clearSelection">清除选择</el-button>
            <el-button 
              size="small" 
              type="danger" 
              :disabled="selectedAssets.length === 0"
              @click="handleBatchDelete"
              v-hasPermi="['article:social-media-asset:remove']"
            >
              批量删除
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 卡片式布局 -->
    <div v-loading="loading" class="asset-cards">
      <div 
        v-for="asset in socialMediaAssetList" 
        :key="asset.id"
        class="asset-card"
        :class="{ 'selected': selectedAssets.includes(asset.id) }"
        @click="toggleSelection(asset)"
      >
        <!-- 选择框 -->
        <div class="card-checkbox">
          <el-checkbox 
            :model-value="selectedAssets.includes(asset.id)"
            @change="toggleSelection(asset)"
            @click.stop
          />
        </div>

        <!-- 平台标签 & 状态标签 -->
        <div class="card-badges">
          <el-tag size="small" type="info">{{ getPlatformName(asset.platform) }}</el-tag>
          <el-tag size="small" :type="getStatusType(asset.status)">{{ getStatusText(asset.status) }}</el-tag>
          <el-tag v-if="asset.contentType" size="small" effect="plain">{{ getContentTypeName(asset.contentType) }}</el-tag>
          <el-tag v-if="asset.qualityLevel" size="small" effect="light" :type="getQualityType(asset.qualityLevel)">{{ getQualityText(asset.qualityLevel) }}</el-tag>
        </div>

        <!-- 卡片头部（标题 & 作者） -->
        <div class="card-header">
          <div class="card-title">
            <h3 class="title-text">{{ asset.title || '无标题' }}</h3>
            <p class="author-text">{{ asset.author || '无作者信息' }}</p>
          </div>
          <div class="card-actions">
            <el-button 
              size="small" 
              type="primary" 
              icon="Edit" 
              @click.stop="handleUpdate(asset)" 
              v-hasPermi="['article:social-media-asset:edit']"
            />
            <el-button 
              size="small" 
              type="danger" 
              icon="Delete" 
              @click.stop="handleDelete(asset)" 
              v-hasPermi="['article:social-media-asset:remove']"
            />
          </div>
        </div>

        <!-- 卡片主体内容 -->
        <div class="card-content">
          <!-- 摘要 -->
          <div v-if="asset.summary" class="summary-section">
            <p class="summary-text">{{ asset.summary }}</p>
          </div>

          <!-- 快照内容 -->
          <div v-if="asset.contentSnapshot" class="snapshot-section">
            <p class="snapshot-text">{{ getContentPreview(asset.contentSnapshot) }}</p>
          </div>

          <!-- 媒体信息 -->
          <div v-if="asset.coverUrl || asset.mediaUrls" class="media-info">
            <span v-if="asset.coverUrl" class="media-item">
              <el-icon><Picture /></el-icon>封面
            </span>
            <span v-if="asset.mediaUrls" class="media-item">
              <el-icon><VideoPlay /></el-icon>媒体
            </span>
            <span v-if="asset.durationSeconds" class="media-item">
              <el-icon><Timer /></el-icon>{{ formatDuration(asset.durationSeconds) }}
            </span>
          </div>

          <!-- 标签 -->
          <div v-if="asset.tags" class="tags-section">
            <el-tag 
              v-for="tag in asset.tags.split(',')" 
              :key="tag" 
              size="small" 
              effect="plain"
              style="margin-right: 4px;"
            >
              {{ tag.trim() }}
            </el-tag>
          </div>
        </div>

        <!-- 指标信息 -->
        <div v-if="asset.metricsSnapshot" class="metrics-section">
          <div class="metrics-item" v-for="(value, key) in parseMetrics(asset.metricsSnapshot)" :key="key">
            <span class="metric-label">{{ getMetricLabel(key) }}：</span>
            <span class="metric-value">{{ value }}</span>
          </div>
        </div>

        <!-- 卡片底部信息 -->
        <div class="card-footer">
          <div class="footer-info">
            <span v-if="asset.sourceUrl" class="source-url" :title="asset.sourceUrl">
              <el-icon><Link /></el-icon>{{ asset.sourceUrl }}
            </span>
          </div>
          <div class="time-info">
            {{ parseTime(asset.captureTime, '{y}-{m}-{d} {h}:{i}') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && socialMediaAssetList.length === 0" description="暂无数据" />
    
    <!-- 分页 -->
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '400px', maxWidth: '50vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="socialMediaAssetRef" :model="form" :rules="rules" label-width="120px" label-position="left" class="dialog-form">
          <!-- 基础信息 -->
          <el-form-item label="平台" prop="platform">
            <el-select v-model="form.platform" placeholder="请选择平台" clearable>
              <el-option label="今日头条" value="toutiao" />
              <el-option label="抖音" value="douyin" />
              <el-option label="B站" value="bilibili" />
              <el-option label="微博" value="weibo" />
              <el-option label="Twitter" value="twitter" />
              <el-option label="Medium" value="medium" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="内容类型" prop="contentType">
            <el-select v-model="form.contentType" placeholder="请选择内容类型" clearable>
              <el-option label="文章" value="article" />
              <el-option label="视频" value="video" />
              <el-option label="图集" value="image_set" />
              <el-option label="音频" value="audio" />
              <el-option label="短文" value="short_post" />
              <el-option label="直播回放" value="live_replay" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="原始链接" prop="sourceUrl">
            <el-input v-model="form.sourceUrl" placeholder="请输入原始链接" clearable />
          </el-form-item>

          <el-form-item label="平台内容ID" prop="externalId">
            <el-input v-model="form.externalId" placeholder="可选：用于去重" clearable />
          </el-form-item>

          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入标题" clearable />
          </el-form-item>

          <el-form-item label="作者" prop="author">
            <el-input v-model="form.author" placeholder="请输入作者/账号名" clearable />
          </el-form-item>

          <el-form-item label="作者ID" prop="authorId">
            <el-input v-model="form.authorId" placeholder="可选：作者在平台的ID" clearable />
          </el-form-item>

          <el-form-item label="发布时间" prop="publishTime">
            <el-date-picker 
              v-model="form.publishTime" 
              type="datetime" 
              placeholder="请选择发布时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>

          <!-- 内容信息 -->
          <el-divider>内容信息</el-divider>

          <el-form-item label="摘要" prop="summary">
            <el-input v-model="form.summary" type="textarea" placeholder="请输入摘要/笔记" :rows="3" />
          </el-form-item>

          <el-form-item label="内容快照" prop="contentSnapshot">
            <el-input v-model="form.contentSnapshot" type="textarea" placeholder="请输入正文/口播稿/文本快照（内容核心）" :rows="4" />
          </el-form-item>

          <el-form-item label="封面链接" prop="coverUrl">
            <el-input v-model="form.coverUrl" placeholder="请输入封面/首图链接" clearable />
          </el-form-item>

          <el-form-item label="媒体链接" prop="mediaUrls">
            <el-input v-model="form.mediaUrls" type="textarea" placeholder="JSON格式：视频/图集/音频直链或存储Key" :rows="2" />
          </el-form-item>

          <el-form-item label="时长(秒)" prop="durationSeconds">
            <el-input v-model.number="form.durationSeconds" type="number" placeholder="视频/音频可填" clearable />
          </el-form-item>

          <!-- 标签与分类 -->
          <el-divider>标签与质量</el-divider>

          <el-form-item label="标签" prop="tags">
            <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" clearable />
          </el-form-item>

          <el-form-item label="质量等级" prop="qualityLevel">
            <el-select v-model="form.qualityLevel" placeholder="请选择质量等级" clearable>
              <el-option label="优" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" clearable>
              <el-option label="可用" value="active" />
              <el-option label="归档" value="archived" />
              <el-option label="失效" value="invalid" />
            </el-select>
          </el-form-item>

          <!-- 版权与备注 -->
          <el-divider>版权与备注</el-divider>

          <el-form-item label="版权备注" prop="licenseNote">
            <el-input v-model="form.licenseNote" type="textarea" placeholder="转载/仅内部参考等" :rows="2" />
          </el-form-item>

          <el-form-item label="运营备注" prop="note">
            <el-input v-model="form.note" type="textarea" placeholder="运营备注" :rows="2" />
          </el-form-item>

          <!-- 采集信息 -->
          <el-divider>采集信息</el-divider>

          <el-form-item label="采集方式" prop="captureMethod">
            <el-select v-model="form.captureMethod" placeholder="请选择采集方式">
              <el-option label="手工" value="manual" />
              <el-option label="爬虫" value="spider" />
              <el-option label="接口" value="api" />
            </el-select>
          </el-form-item>

          <el-form-item label="指标快照" prop="metricsSnapshot">
            <el-input v-model="form.metricsSnapshot" type="textarea" placeholder="JSON格式：{&quot;read&quot;:100, &quot;like&quot;:20, &quot;comment&quot;:5}" :rows="2" />
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

<script setup name="SocialMediaAsset">
import { addSocialMediaAsset, delSocialMediaAsset, getSocialMediaAsset, listSocialMediaAsset, updateSocialMediaAsset } from "@/api/article/socialMediaAsset";
import { Link, Picture, Timer, VideoPlay } from '@element-plus/icons-vue';
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
const socialMediaAssetRef = ref();
const queryRef = ref();

const socialMediaAssetList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeCaptureTime = ref([]);
const selectedAssets = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    platform: null,
    contentType: null,
    status: null,
    qualityLevel: null,
    keyword: null,
  },
  rules: {
    platform: [
      { required: true, message: "平台不能为空", trigger: "change" }
    ],
    contentType: [
      { required: true, message: "内容类型不能为空", trigger: "change" }
    ],
    sourceUrl: [
      { required: true, message: "原始链接不能为空", trigger: "blur" }
    ],
    title: [
      { required: true, message: "标题不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询自媒体素材列表 */
async function getList() {
  loading.value = true;
  try {
    if (daterangeCaptureTime.value && daterangeCaptureTime.value.length === 2) {
      queryParams.value.params = {
        ...queryParams.value.params,
        beginCaptureTime: daterangeCaptureTime.value[0],
        endCaptureTime: daterangeCaptureTime.value[1]
      };
    }
    const response = await listSocialMediaAsset(queryParams.value);
    socialMediaAssetList.value = response.rows;
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
    platform: null,
    contentType: null,
    sourceUrl: null,
    externalId: null,
    author: null,
    authorId: null,
    publishTime: null,
    title: null,
    summary: null,
    contentSnapshot: null,
    coverUrl: null,
    mediaUrls: null,
    durationSeconds: null,
    tags: null,
    qualityLevel: null,
    status: 'active',
    licenseNote: null,
    note: null,
    captureMethod: 'manual',
    metricsSnapshot: null,
  };
  if (socialMediaAssetRef.value) {
    socialMediaAssetRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeCaptureTime.value = [];
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
  handleQuery();
}

// 卡片选择管理
function toggleSelection(asset) {
  const index = selectedAssets.value.indexOf(asset.id);
  if (index > -1) {
    selectedAssets.value.splice(index, 1);
  } else {
    selectedAssets.value.push(asset.id);
  }
  ids.value = selectedAssets.value;
  single.value = selectedAssets.value.length !== 1;
  multiple.value = selectedAssets.value.length === 0;
}

// 清除选择
function clearSelection() {
  selectedAssets.value = [];
  ids.value = [];
  single.value = true;
  multiple.value = true;
}

// 批量删除
async function handleBatchDelete() {
  if (selectedAssets.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要删除的素材');
    return;
  }
  
  try {
    await proxy.$modal.confirm(`是否确认删除选中的 ${selectedAssets.value.length} 条素材？`);
    await delSocialMediaAsset(selectedAssets.value.join(','));
    clearSelection();
    getList();
    proxy.$modal.msgSuccess('批量删除成功');
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
    } else {
      proxy.$modal.msgError('批量删除失败：' + error);
    }
  }
}

// 获取平台名称
function getPlatformName(platform) {
  const platformMap = {
    'toutiao': '今日头条',
    'douyin': '抖音',
    'bilibili': 'B站',
    'weibo': '微博',
    'twitter': 'Twitter',
    'medium': 'Medium',
    'other': '其他'
  };
  return platformMap[platform] || platform;
}

// 获取内容类型名称
function getContentTypeName(contentType) {
  const contentTypeMap = {
    'article': '文章',
    'video': '视频',
    'image_set': '图集',
    'audio': '音频',
    'short_post': '短文',
    'live_replay': '直播回放',
    'other': '其他'
  };
  return contentTypeMap[contentType] || contentType;
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'active': '可用',
    'archived': '归档',
    'invalid': '失效'
  };
  return statusMap[status] || status;
}

// 获取状态类型
function getStatusType(status) {
  const statusTypeMap = {
    'active': 'success',
    'archived': 'warning',
    'invalid': 'danger'
  };
  return statusTypeMap[status] || 'info';
}

// 获取质量文本
function getQualityText(qualityLevel) {
  const qualityMap = {
    'high': '优',
    'medium': '中',
    'low': '低'
  };
  return qualityMap[qualityLevel] || qualityLevel;
}

// 获取质量类型
function getQualityType(qualityLevel) {
  const qualityTypeMap = {
    'high': 'success',
    'medium': 'warning',
    'low': 'danger'
  };
  return qualityTypeMap[qualityLevel] || 'info';
}

// 获取内容预览
function getContentPreview(content) {
  if (!content) return '暂无内容';
  return content.length > 150 ? content.substring(0, 150) + '...' : content;
}

// 格式化时长
function formatDuration(seconds) {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

// 解析指标快照 JSON
function parseMetrics(metricsSnapshot) {
  if (!metricsSnapshot) return {};
  try {
    return typeof metricsSnapshot === 'string' ? JSON.parse(metricsSnapshot) : metricsSnapshot;
  } catch (error) {
    return {};
  }
}

// 获取指标标签
function getMetricLabel(key) {
  const metricMap = {
    'read': '阅读',
    'like': '点赞',
    'comment': '评论',
    'share': '分享',
    'view': '浏览',
    'collect': '收藏'
  };
  return metricMap[key] || key;
}

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    formLoading.value = false;
    open.value = true;
    title.value = "添加自媒体素材";
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
    const response = await getSocialMediaAsset(editId);
    form.value = response;
    open.value = true;
    title.value = "修改自媒体素材";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await socialMediaAssetRef.value.validate();
  } catch (error) {
    return;
  }

  formLoading.value = true;
  try {
    if (form.value.id != null) {
      await updateSocialMediaAsset(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addSocialMediaAsset(form.value);
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
    await proxy.$modal.confirm('是否确认删除编号为"' + deleteIds + '"的数据项？');
    await delSocialMediaAsset(deleteIds);
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
    } else {
      proxy.$modal.msgError("删除失败：" + error);
    }
  }
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('article/social-media-asset/export', {
    ...queryParams.value
  }, 'socialMediaAsset_' + new Date().getTime() + '.xlsx')
}

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  loading.value = false;
  formLoading.value = false;
});
</script>

<style scoped>
/* 卡片容器 */
.asset-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

/* 单个卡片 */
.asset-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.asset-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.asset-card.selected {
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

/* 平台与状态标签 */
.card-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  margin-left: 32px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  flex: 1;
  min-width: 0;
}

.title-text {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.3;
}

.card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.card-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 卡片内容 */
.card-content {
  flex: 1;
  margin-bottom: 12px;
}

.summary-section {
  margin-bottom: 12px;
}

.summary-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.snapshot-section {
  margin-bottom: 12px;
}

.snapshot-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
}

.media-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.media-item .el-icon {
  font-size: 14px;
}

.tags-section {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 0;
}

/* 指标信息 */
.metrics-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 12px;
}

.metrics-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-label {
  color: #909399;
}

.metric-value {
  color: #303133;
  font-weight: 600;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #909399;
}

.footer-info {
  flex: 1;
  min-width: 0;
}

.source-url {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #409eff;
  cursor: pointer;
}

.source-url:hover {
  text-decoration: underline;
}

.source-url .el-icon {
  flex-shrink: 0;
}

.time-info {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 批量操作工具栏 */
.batch-toolbar {
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .asset-cards {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .asset-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
  }
  
  .metrics-section {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* 空状态样式 */
.el-empty {
  padding: 60px 0;
}
</style>
