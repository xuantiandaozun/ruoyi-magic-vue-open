<template>
  <div class="app-container">
    <!-- 工作流信息 -->
    <el-card class="mb8" v-if="workflowInfo.id">
      <template #header>
        <div class="card-header">
          <span>工作流信息</span>
          <el-button type="text" @click="goBack">返回工作流列表</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="工作流名称">{{ workflowInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="工作流类型">{{ workflowInfo.type }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ workflowInfo.version }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{ workflowInfo.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="步骤名称" prop="stepName">
        <el-input
          v-model="queryParams.stepName"
          placeholder="请输入步骤名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择启用状态" clearable>
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="工具类型" prop="toolTypes">
        <el-select v-model="queryParams.toolTypes" placeholder="请选择工具类型" clearable>
          <el-option label="GitHub趋势查询" value="github_trending" />
          <el-option label="数据库查询" value="database_query" />
          <el-option label="博客保存" value="blog_save" />
          <el-option label="英文博客保存" value="blog_en_save" />
          <el-option label="自媒体文章保存" value="social_media_article_save" />
        </el-select>
      </el-form-item>
      <el-form-item label="工具状态" prop="toolEnabled">
        <el-select v-model="queryParams.toolEnabled" placeholder="请选择工具状态" clearable>
          <el-option label="已启用" value="Y" />
          <el-option label="未启用" value="N" />
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
          v-hasPermi="['ai:workflow:add']"
        >新增步骤</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ai:workflow:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:workflow:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="stepList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="步骤ID" align="center" prop="id" width="80" />
      <el-table-column label="步骤名称" align="center" prop="stepName" :show-overflow-tooltip="true" />
      <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="执行顺序" align="center" prop="stepOrder" width="100">
        <template #default="scope">
          <el-tag type="primary">{{ scope.row.stepOrder }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模型配置" align="center" prop="modelConfigId" width="200">
        <template #default="scope">
          <el-select 
            v-model="scope.row.modelConfigId" 
            placeholder="选择模型配置" 
            @change="handleModelConfigChange(scope.row)"
            style="width: 100%;"
            size="small"
          >
            <el-option
              v-for="model in modelConfigList"
              :key="model.id"
              :label="`${model.provider}/${model.model}`"
              :value="model.id"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="输入变量" align="center" prop="inputVariable" width="120" />
      <el-table-column label="输出变量" align="center" prop="outputVariable" width="120" />
      <el-table-column label="用户提示词" align="center" prop="userPrompt" width="200" :show-overflow-tooltip="true">
        <template #default="scope">
          <span v-if="scope.row.userPrompt" class="text-sm">
            {{ scope.row.userPrompt.length > 50 ? scope.row.userPrompt.substring(0, 50) + '...' : scope.row.userPrompt }}
          </span>
          <span v-else class="text-gray-400">未设置</span>
        </template>
      </el-table-column>
      <el-table-column label="工具类型" align="center" prop="toolTypes" width="200">
        <template #default="scope">
          <div v-if="scope.row.toolTypes" class="flex flex-wrap gap-1">
            <el-tag 
              v-for="toolType in scope.row.toolTypes.split(',')" 
              :key="toolType.trim()" 
              type="info" 
              size="small"
            >
              {{ getToolTypeName(toolType.trim()) }}
            </el-tag>
          </div>
          <span v-else class="text-gray-400">无</span>
        </template>
      </el-table-column>
      <el-table-column label="工具状态" align="center" prop="toolEnabled" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.toolEnabled === 'Y'" type="success" size="small">已启用</el-tag>
          <el-tag v-else-if="scope.row.toolEnabled === 'N'" type="info" size="small">未启用</el-tag>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="enabled" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            active-value="1"
            inactive-value="0"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['ai:workflow:edit']"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:workflow:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:workflow:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:workflow:remove']">删除</el-button>
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

    <!-- 添加或修改工作流步骤对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="stepRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="步骤名称" prop="stepName">
              <el-input v-model="form.stepName" placeholder="请输入步骤名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行顺序" prop="stepOrder">
              <el-input-number v-model="form.stepOrder" :min="1" :max="100" placeholder="执行顺序" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="步骤描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入步骤描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模型配置ID" prop="modelConfigId">
              <el-select v-model="form.modelConfigId" placeholder="请选择模型配置" style="width: 100%">
                <el-option
                  v-for="model in modelConfigList"
                  :key="model.id"
                  :label="`${model.provider}/${model.model}`"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态" prop="enabled">
              <el-radio-group v-model="form.enabled">
                <el-radio label="1">启用</el-radio>
                <el-radio label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="输入变量名" prop="inputVariable">
              <el-input v-model="form.inputVariable" placeholder="如：userInput" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输出变量名" prop="outputVariable">
              <el-input v-model="form.outputVariable" placeholder="如：stepOutput" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="系统提示词" prop="systemPrompt">
          <el-input v-model="form.systemPrompt" type="textarea" :rows="4" placeholder="请输入系统提示词" />
        </el-form-item>
        <el-form-item label="用户提示词" prop="userPrompt">
          <div class="flex gap-2 mb-2">
            <el-button size="small" type="primary" plain @click="validateUserPrompt" :loading="validatingPrompt">
              验证变量
            </el-button>
            <el-button size="small" type="success" plain @click="showVariableHelp">
              变量帮助
            </el-button>
          </div>
          <el-input 
            v-model="form.userPrompt" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入用户提示词，支持变量占位符，如：请帮我整理下面的文案{{userInput}}"
            @blur="autoValidateUserPrompt"
          />
          <div class="mt-2 text-sm" v-if="promptValidationResult">
            <div v-if="promptValidationResult.isValid" class="text-green-600">
              ✅ 变量验证通过
              <span v-if="promptValidationResult.variables.length > 0">
                - 发现变量: {{ promptValidationResult.variables.join(', ') }}
              </span>
            </div>
            <div v-else class="text-red-600">
              ❌ 变量验证失败
              <span v-if="promptValidationResult.missingVariables.length > 0">
                - 缺失变量: {{ promptValidationResult.missingVariables.join(', ') }}
              </span>
            </div>
          </div>
          <div class="mt-1 text-xs text-gray-500">
            提示：使用 {{变量名}} 格式定义变量，如 {{userInput}}、{{fileName}} 等
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="4" placeholder="请输入配置JSON（可选）" />
        </el-form-item>
        
        <!-- 工具配置区域 -->
        <el-divider content-position="left">智能工具配置</el-divider>
        <el-alert 
          title="💡 智能提示" 
          description="工具参数将由AI根据上下文自动决定，您只需选择合适的工具类型即可。AI会智能分析用户需求并自动配置所有必要参数。"
          type="success" 
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="启用工具" prop="toolEnabled">
              <el-switch
                v-model="form.toolEnabled"
                active-value="Y"
                inactive-value="N"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工具类型" prop="toolTypes" v-if="form.toolEnabled === 'Y'">
              <el-select 
                v-model="form.toolTypesArray" 
                placeholder="请选择工具类型（可多选）" 
                style="width: 100%"
                multiple
                collapse-tags
                collapse-tags-tooltip
                @change="handleToolTypesChange"
              >
                <el-option label="GitHub趋势查询" value="github_trending" />
                <el-option label="数据库查询" value="database_query" />
                <el-option label="博客保存" value="blog_save" />
                <el-option label="英文博客保存" value="blog_en_save" />
                <el-option label="自媒体文章保存" value="social_media_article_save" />
                <el-option label="OSS文件读取" value="oss_file_read" />
                <el-option label="GitHub仓库目录" value="github_repo_tree" />
                <el-option label="GitHub文件内容" value="github_file_content" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工具说明" v-if="form.toolEnabled === 'Y' && form.toolTypesArray && form.toolTypesArray.length > 0">
          <div class="space-y-2">
            <el-alert 
              v-for="toolType in form.toolTypesArray"
              :key="toolType"
              :title="`${getToolTypeName(toolType)}: ${getToolDescription(toolType)}`"
              type="info" 
              :closable="false"
              show-icon
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工作流步骤详情对话框 -->
    <el-dialog title="步骤详情" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="步骤ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="步骤名称">{{ detailForm.stepName }}</el-descriptions-item>
        <el-descriptions-item label="执行顺序">{{ detailForm.stepOrder }}</el-descriptions-item>
        <el-descriptions-item label="模型配置ID">{{ detailForm.modelConfigId }}</el-descriptions-item>
        <el-descriptions-item label="输入变量名">{{ detailForm.inputVariable }}</el-descriptions-item>
        <el-descriptions-item label="输出变量名">{{ detailForm.outputVariable }}</el-descriptions-item>
        <el-descriptions-item label="启用状态">
          <el-tag :type="detailForm.enabled === '1' ? 'success' : 'danger'">
            {{ detailForm.enabled === '1' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="sys_normal_disable" :value="detailForm.status"/>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(detailForm.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailForm.description }}</el-descriptions-item>
        <el-descriptions-item label="系统提示词" :span="2" v-if="detailForm.systemPrompt">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ detailForm.systemPrompt }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="用户提示词" :span="2" v-if="detailForm.userPrompt">
          <pre style="white-space: pre-wrap; word-break: break-all; background: #f0f9ff; padding: 10px; border-radius: 4px; border-left: 4px solid #3b82f6;">{{ detailForm.userPrompt }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="配置JSON" :span="2" v-if="detailForm.configJson">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ detailForm.configJson }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="工具状态">
          <el-tag v-if="detailForm.toolEnabled === 'Y'" type="success">已启用</el-tag>
          <el-tag v-else-if="detailForm.toolEnabled === 'N'" type="info">未启用</el-tag>
          <span v-else class="text-gray-400">未配置</span>
        </el-descriptions-item>
        <el-descriptions-item label="工具类型">
          <div v-if="detailForm.toolTypes" class="flex flex-wrap gap-1">
            <el-tag 
              v-for="toolType in detailForm.toolTypes.split(',')" 
              :key="toolType.trim()" 
              type="primary"
            >
              {{ getToolTypeName(toolType.trim()) }}
            </el-tag>
          </div>
          <span v-else class="text-gray-400">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="工具说明" v-if="detailForm.toolTypes" :span="2">
          <div class="space-y-2">
            <div v-for="toolType in detailForm.toolTypes.split(',')" :key="toolType.trim()">
              <strong>{{ getToolTypeName(toolType.trim()) }}:</strong> {{ getToolDescription(toolType.trim()) }}
            </div>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="AiWorkflowStep">
import { listWorkflowSteps, listStepsByWorkflowId, getWorkflowStep, delWorkflowStep, addWorkflowStep, updateWorkflowStep, toggleWorkflowStepStatus, validatePromptVariables } from "@/api/ai/workflowStep";
import { getWorkflow } from "@/api/ai/workflow";
import { getAvailableChatModels } from "@/api/ai/modelConfig";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');
const route = useRoute();
const router = useRouter();

const stepList = ref([]);
const modelConfigList = ref([]);
const workflowInfo = ref({});
const open = ref(false);
const detailOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const validatingPrompt = ref(false);
const promptValidationResult = ref(null);

const data = reactive({
  form: {},
  detailForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workflowId: null,
    stepName: null,
    enabled: null,
    toolTypes: null,
    toolEnabled: null,
  },
  rules: {
    stepName: [
      { required: true, message: "步骤名称不能为空", trigger: "blur" }
    ],
    stepOrder: [
      { required: true, message: "执行顺序不能为空", trigger: "blur" }
    ],
    modelConfigId: [
      { required: true, message: "模型配置不能为空", trigger: "change" }
    ],
    inputVariable: [
      // 输入变量名改为非必填，特别是对于第一步
    ],
    outputVariable: [
      { required: true, message: "输出变量名不能为空", trigger: "blur" }
    ],
    enabled: [
      { required: true, message: "启用状态不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ]
  }
});

const { queryParams, form, detailForm, rules } = toRefs(data);

/** 查询工作流步骤列表 */
function getList() {
  loading.value = true;
  if (queryParams.value.workflowId) {
    // 如果有工作流ID，查询该工作流的步骤
    listStepsByWorkflowId(queryParams.value.workflowId).then(response => {
      stepList.value = response || [];
      total.value = stepList.value.length;
      loading.value = false;
    });
  } else {
    // 否则查询所有步骤
    listWorkflowSteps(queryParams.value).then(response => {
      stepList.value = response.rows;
      total.value = response.total;
      loading.value = false;
    });
  }
}

/** 加载工作流信息 */
function loadWorkflowInfo() {
  const workflowId = route.query.workflowId;
  if (workflowId) {
    queryParams.value.workflowId = workflowId;
    getWorkflow(workflowId).then(response => {
      workflowInfo.value = response;
    });
  }
}

/** 加载模型配置列表 */
function loadModelConfigs() {
  getAvailableChatModels().then(response => {
    if (Array.isArray(response)) {
      modelConfigList.value = response;
      return;
    }
    if (response && Array.isArray(response.data)) {
      modelConfigList.value = response.data;
      return;
    }
    modelConfigList.value = [];
  }).catch(error => {
    console.error('加载聊天模型失败:', error);
    modelConfigList.value = [];
  });
}

// 取消按钮
function cancel() {
  // 先重置表单，再关闭弹窗，避免关闭过程中 ref 未就绪导致错误
  reset();
  open.value = false;
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    workflowId: queryParams.value.workflowId,
    stepName: null,
    description: null,
    stepOrder: 1,
    modelConfigId: null,
    systemPrompt: null,
    userPrompt: null,
    inputVariable: null,
    outputVariable: null,
    enabled: "1",
    status: "0",
    configJson: null,
    toolTypes: null,
    toolTypesArray: [],
    toolEnabled: "N"
  };
  proxy.resetForm("stepRef");
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

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加工作流步骤";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getWorkflowStep(_id).then(response => {
    form.value = response;
    // 处理工具类型数组
    if (form.value.toolTypes) {
      form.value.toolTypesArray = form.value.toolTypes.split(',').map(type => type.trim());
    } else {
      form.value.toolTypesArray = [];
    }
    open.value = true;
    title.value = "修改工作流步骤";
  });
}

/** 详情按钮操作 */
function handleDetail(row) {
  const _id = row.id;
  getWorkflowStep(_id).then(response => {
    detailForm.value = response;
    detailOpen.value = true;
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["stepRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateWorkflowStep(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWorkflowStep(form.value).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除工作流步骤编号为"' + _ids + '"的数据项？').then(function() {
    return delWorkflowStep(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 启用/禁用状态切换 */
function handleStatusChange(row) {
  let text = row.enabled === "1" ? "启用" : "禁用";
  proxy.$modal.confirm('确认要"' + text + '""' + row.stepName + '"步骤吗？').then(function() {
    return toggleWorkflowStepStatus(row.id);
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功");
    getList();
  }).catch(function() {
    row.enabled = row.enabled === "0" ? "1" : "0";
  });
}

/** 模型配置变更处理 */
function handleModelConfigChange(row) {
  const selectedModel = modelConfigList.value.find(model => model.id === row.modelConfigId);
  if (selectedModel) {
    // 自动保存模型配置变更
    updateWorkflowStep(row).then(response => {
      proxy.$modal.msgSuccess(`已更新为模型: ${selectedModel.provider}/${selectedModel.model}`);
      getList();
    }).catch(error => {
      console.error('更新模型配置失败:', error);
      proxy.$modal.msgError("更新模型配置失败");
      // 恢复原值
      getList();
    });
  }
}



/** 获取工具类型显示名称 */
function getToolTypeName(toolType) {
  const typeNames = {
    'github_trending': 'GitHub趋势查询',
    'database_query': '数据库查询',
    'blog_save': '博客保存',
    'blog_en_save': '英文博客保存',
    'social_media_article_save': '社交媒体文章保存',
    'oss_file_read': 'OSS文件读取',
    'github_repo_tree': 'GitHub仓库目录',
    'github_file_content': 'GitHub文件内容'
  };
  return typeNames[toolType] || toolType;
}

/** 获取工具描述信息 */
function getToolDescription(toolType) {
  const descriptions = {
    'github_trending': '🔍 GitHub趋势查询工具：AI会智能分析用户需求，自动确定查询的编程语言、时间范围等参数，获取最新的GitHub趋势项目信息。',
    'database_query': '💾 数据库查询工具：AI会根据用户的查询需求，自动生成并执行合适的SQL语句，无需手动编写查询语句。',
    'blog_save': '📝 博客保存工具：AI会智能识别博客内容，自动处理标题、内容、标签等信息，保存到博客系统中。',
    'blog_en_save': '📝 英文博客保存工具：AI会智能识别英文博客内容，自动处理标题、内容、标签等信息，保存到英文博客系统中。',
    'social_media_article_save': '📱 社交媒体文章保存工具：AI会智能识别社交媒体文章内容，自动处理标题、内容、平台信息等，保存到社交媒体管理系统中。',
    'oss_file_read': '📄 OSS文件读取工具：AI会通过OSS URL获取远程文件内容，支持README文档等文件的读取，无需手动配置URL和参数。',
    'github_repo_tree': '🌳 GitHub仓库目录工具：AI会通过GitHub API获取指定仓库的文件目录结构，支持递归查看和分支选择，无需手动配置仓库信息。',
    'github_file_content': '📄 GitHub文件内容工具：AI会通过GitHub API获取指定仓库中特定文件的完整内容，支持代码文件、配置文件等，无需手动配置仓库和文件路径。'
  };
  return descriptions[toolType] || '🤖 智能工具：该工具将由AI根据上下文自动调用，所有参数都由AI智能决定，无需人工配置。';
}



/** 返回工作流列表 */
function goBack() {
  router.push('/ai/workflow');
}

/** 验证用户提示词中的变量 */
async function validateUserPrompt() {
  if (!form.value.userPrompt || form.value.userPrompt.trim() === '') {
    promptValidationResult.value = null;
    return;
  }
  
  validatingPrompt.value = true;
  try {
    const response = await validatePromptVariables(form.value.userPrompt);
    promptValidationResult.value = {
      isValid: response.code === 200,
      variables: response.data?.variableNames || [],
      missingVariables: response.data?.missingVariables || []
    };
  } catch (error) {
    console.error('变量验证失败:', error);
    proxy.$modal.msgError('变量验证失败，请检查网络连接');
    promptValidationResult.value = null;
  } finally {
    validatingPrompt.value = false;
  }
}

/** 自动验证用户提示词（失焦时触发） */
function autoValidateUserPrompt() {
  if (form.value.userPrompt && form.value.userPrompt.trim() !== '') {
    validateUserPrompt();
  } else {
    promptValidationResult.value = null;
  }
}

/** 处理工具类型数组变化 */
function handleToolTypesChange(value) {
  // 将数组转换为逗号分隔的字符串存储到 toolTypes 字段
  form.value.toolTypes = value && value.length > 0 ? value.join(',') : null;
}

/** 显示变量帮助信息 */
function showVariableHelp() {
  proxy.$modal.alert(`
    <div style="text-align: left;">
      <h4>变量使用说明：</h4>
      <p>1. 使用双大括号包围变量名：<code>{{变量名}}</code></p>
      <p>2. 变量名只能包含字母、数字和下划线</p>
      <p>3. 常用变量示例：</p>
      <ul>
        <li><code>{{userInput}}</code> - 用户输入内容</li>
        <li><code>{{fileName}}</code> - 文件名</li>
        <li><code>{{content}}</code> - 文本内容</li>
        <li><code>{{previousOutput}}</code> - 上一步输出</li>
      </ul>
      <p>4. 示例提示词：</p>
      <p><code>请帮我整理下面的文案：{{userInput}}</code></p>
    </div>
  `, '变量使用帮助', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '知道了'
  });
}

onMounted(() => {
  loadWorkflowInfo();
  loadModelConfigs();
  getList();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
