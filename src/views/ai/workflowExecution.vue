<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 工作流执行区域 -->
      <el-col :span="12">
        <el-card class="execution-card">
          <template #header>
            <div class="card-header">
              <span>工作流执行</span>
            </div>
          </template>
          
          <el-form ref="executionRef" :model="executionForm" :rules="executionRules" label-width="100px">
            <el-form-item label="选择工作流" prop="workflowId">
              <el-select v-model="executionForm.workflowId" placeholder="请选择工作流" style="width: 100%" @change="handleWorkflowChange">
                <el-option
                  v-for="workflow in enabledWorkflows"
                  :key="workflow.id"
                  :label="workflow.name"
                  :value="workflow.id"
                />
              </el-select>
            </el-form-item>
            
            <!-- 动态输入字段 -->
            <div v-if="inputFields.length > 0" class="dynamic-inputs">
              <el-divider content-position="left">
                <span>输入参数</span>
                <el-button size="small" type="text" @click="showVariableHelp" class="ml-2">
                  <el-icon><QuestionFilled /></el-icon>
                  变量说明
                </el-button>
              </el-divider>
              <el-form-item 
                v-for="field in inputFields" 
                :key="field.key" 
                :prop="`dynamicInputs.${field.key}`"
                :rules="field.required ? [{ required: true, message: `${field.label}不能为空`, trigger: 'blur' }] : []"
              >
                <template #label>
                  <div class="flex items-center">
                    <span>{{ field.label }}</span>
                    <el-tag v-if="field.required" type="danger" size="small" class="ml-1">必填</el-tag>
                    <el-tag v-if="field.fromStep" type="info" size="small" class="ml-1">来自步骤: {{ field.fromStep }}</el-tag>
                  </div>
                </template>
                
                <!-- 文本输入 -->
                <el-input
                  v-if="field.type === 'text'"
                  v-model="executionForm.dynamicInputs[field.key]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  @input="handleDynamicInputChange"
                  clearable
                />
                <!-- 数字输入 -->
                <el-input-number
                  v-else-if="field.type === 'number'"
                  v-model="executionForm.dynamicInputs[field.key]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  style="width: 100%"
                  @change="handleDynamicInputChange"
                />
                <!-- 开关输入 -->
                <div v-else-if="field.type === 'switch'" class="flex items-center">
                  <el-switch
                    v-model="executionForm.dynamicInputs[field.key]"
                    @change="handleDynamicInputChange"
                  />
                  <span class="ml-2 text-sm text-gray-500">{{ field.description || '开启/关闭此选项' }}</span>
                </div>
                <!-- 文本域输入 -->
                <el-input
                  v-else-if="field.type === 'textarea'"
                  v-model="executionForm.dynamicInputs[field.key]"
                  type="textarea"
                  :rows="field.rows || 3"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  @input="handleDynamicInputChange"
                  show-word-limit
                  :maxlength="field.maxLength || 1000"
                />
                
                <!-- 字段描述 -->
                <div v-if="field.description" class="mt-1 text-xs text-gray-500">
                  {{ field.description }}
                </div>
              </el-form-item>
            </div>
            
            <!-- JSON输入（隐藏，仅用于内部数据传递） -->
             <el-form-item label="JSON参数" prop="inputParams" v-if="executionForm.workflowId && inputFields.length === 0" style="display: none;">
               <el-input
                 v-model="executionForm.inputParams"
                 type="textarea"
                 :rows="4"
                 placeholder="JSON参数"
               />
             </el-form-item>
            
            <el-form-item label="执行模式" prop="executionMode">
              <el-radio-group v-model="executionForm.executionMode">
                <el-radio label="normal">普通执行</el-radio>
                <el-radio label="quick">快速执行</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleExecute" :loading="executing" :disabled="!executionForm.workflowId">
                <el-icon><VideoPlay /></el-icon>
                {{ executing ? '执行中...' : '执行工作流' }}
              </el-button>
              <el-button @click="resetExecutionForm">重置</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 执行结果显示 -->
          <el-divider content-position="left">
            <span>执行结果</span>
            <el-button v-if="executionResult" size="small" type="text" @click="copyResult" class="ml-2">
              <el-icon><CopyDocument /></el-icon>
              复制结果
            </el-button>
          </el-divider>
          <div v-if="executionResult" class="execution-result">
            <el-alert
              :title="executionResult.success ? '执行成功' : '执行失败'"
              :type="executionResult.success ? 'success' : 'error'"
              :description="executionResult.message"
              show-icon
              :closable="false"
              class="mb-4"
            />
            
            <!-- 执行统计信息 -->
            <el-row :gutter="16" class="mb-4" v-if="executionResult.executionId">
              <el-col :span="8">
                <el-statistic title="执行ID" :value="executionResult.executionId" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="执行时间" :value="executionResult.executionTime" suffix="ms" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="步骤数量" :value="executionResult.stepCount || 0" />
              </el-col>
            </el-row>
            
            <!-- 步骤执行详情 -->
            <div v-if="executionResult.stepResults && executionResult.stepResults.length > 0" class="step-results mb-4">
              <h4 class="mb-2">步骤执行详情：</h4>
              <el-timeline>
                <el-timeline-item
                  v-for="(step, index) in executionResult.stepResults"
                  :key="index"
                  :type="step.success ? 'success' : 'danger'"
                  :timestamp="step.timestamp"
                >
                  <el-card class="step-result-card">
                    <div class="flex justify-between items-center mb-2">
                      <h5>{{ step.stepName }}</h5>
                      <el-tag :type="step.success ? 'success' : 'danger'" size="small">
                        {{ step.success ? '成功' : '失败' }}
                      </el-tag>
                    </div>
                    <div v-if="step.output" class="step-output">
                      <p class="text-sm text-gray-600 mb-1">输出结果：</p>
                      <pre class="step-output-content">{{ step.output }}</pre>
                    </div>
                    <div v-if="step.error" class="step-error">
                      <p class="text-sm text-red-600 mb-1">错误信息：</p>
                      <pre class="step-error-content">{{ step.error }}</pre>
                    </div>
                    <div v-if="step.executionTime" class="text-xs text-gray-500 mt-2">
                      执行时间: {{ step.executionTime }}ms
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
            
            <!-- 最终输出结果 -->
            <div v-if="executionResult.output" class="result-output">
              <h4 class="mb-2">最终输出结果：</h4>
              <el-card class="output-card">
                <pre class="result-output-content">{{ executionResult.output }}</pre>
              </el-card>
            </div>
            
            <!-- 错误信息 -->
            <div v-if="executionResult.error" class="result-error">
              <h4 class="mb-2">错误信息：</h4>
              <el-card class="error-card">
                <pre class="result-error-content">{{ executionResult.error }}</pre>
              </el-card>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 工作流信息区域 -->
      <el-col :span="12">
        <el-card class="workflow-info-card" v-if="selectedWorkflow">
          <template #header>
            <div class="card-header">
              <span>工作流信息</span>
              <el-button type="text" @click="viewWorkflowSteps" v-if="selectedWorkflow.id">查看步骤</el-button>
            </div>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="工作流名称">{{ selectedWorkflow.name }}</el-descriptions-item>
            <el-descriptions-item label="工作流类型">{{ selectedWorkflow.type }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ selectedWorkflow.version }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedWorkflow.enabled === '1' ? 'success' : 'danger'">
                {{ selectedWorkflow.enabled === '1' ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述">{{ selectedWorkflow.description }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 执行历史 -->
    <el-card class="mt20">
      <template #header>
        <div class="card-header">
          <span>执行历史</span>
          <el-button type="text" @click="refreshHistory">刷新</el-button>
        </div>
      </template>
      
      <el-form :model="historyQueryParams" ref="historyQueryRef" :inline="true" v-show="showHistorySearch" label-width="80px">
        <el-form-item label="工作流" prop="workflowId">
          <el-select v-model="historyQueryParams.workflowId" placeholder="请选择工作流" clearable>
            <el-option
              v-for="workflow in enabledWorkflows"
              :key="workflow.id"
              :label="workflow.name"
              :value="workflow.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态" prop="status">
          <el-select v-model="historyQueryParams.status" placeholder="请选择状态" clearable>
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="执行中" value="running" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleHistoryQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetHistoryQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="historyMultiple"
            @click="handleDeleteHistory"
            v-hasPermi="['ai:workflow:remove']"
          >删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showHistorySearch" @queryTable="getHistoryList"></right-toolbar>
      </el-row>

      <el-table v-loading="historyLoading" :data="historyList" @selection-change="handleHistorySelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="执行ID" align="center" prop="id" width="80" />
        <el-table-column label="工作流ID" align="center" prop="workflowId" width="100" />
        <el-table-column label="工作流名称" align="center" prop="workflowName" :show-overflow-tooltip="true" />
        <el-table-column label="执行状态" align="center" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="updateTime" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleHistoryDetail(scope.row)" v-hasPermi="['ai:workflow:query']">详情</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDeleteHistory(scope.row)" v-hasPermi="['ai:workflow:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <pagination
        v-show="historyTotal>0"
        :total="historyTotal"
        v-model:page="historyQueryParams.pageNum"
        v-model:limit="historyQueryParams.pageSize"
        @pagination="getHistoryList"
      />
    </el-card>

    <!-- 执行历史详情对话框 -->
    <el-dialog title="执行详情" v-model="historyDetailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="执行ID">{{ historyDetailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="工作流ID">{{ historyDetailForm.workflowId }}</el-descriptions-item>
        <el-descriptions-item label="工作流名称">{{ historyDetailForm.workflowName }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="getStatusType(historyDetailForm.status)">
            {{ getStatusText(historyDetailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="historyDetailForm.errorMessage">{{ historyDetailForm.errorMessage }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(historyDetailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(historyDetailForm.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="输入数据" :span="2" v-if="historyDetailForm.inputData">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ historyDetailForm.inputData }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="输出数据" :span="2" v-if="historyDetailForm.outputData">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ historyDetailForm.outputData }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="AiWorkflowExecution">
import { ref, reactive, toRefs, getCurrentInstance, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { parseTime } from '@/utils/ruoyi';
import { CopyDocument, QuestionFilled } from '@element-plus/icons-vue';
import { executeWorkflow, quickExecuteWorkflow, listWorkflowExecutions, getWorkflowExecution, delWorkflowExecution, getWorkflowVariables } from "@/api/ai/workflowExecution";
import { getEnabledWorkflows, getWorkflow } from "@/api/ai/workflow";
import { listStepsByWorkflowId } from "@/api/ai/workflowStep";

const { proxy } = getCurrentInstance();
const router = useRouter();

const enabledWorkflows = ref([]);
const selectedWorkflow = ref({});
const workflowSteps = ref([]);
const inputFields = ref([]);
const historyList = ref([]);
const executing = ref(false);
const historyLoading = ref(true);
const showHistorySearch = ref(true);
const historyIds = ref([]);
const historyMultiple = ref(true);
const historyTotal = ref(0);
const historyDetailOpen = ref(false);
const executionResult = ref(null);

const data = reactive({
  executionForm: {
    workflowId: null,
    inputParams: '{}',
    executionMode: 'normal',
    dynamicInputs: {} // 新增动态输入字段
  },
  historyDetailForm: {},
  historyQueryParams: {
    pageNum: 1,
    pageSize: 10,
    workflowId: null,
    status: null,
  },
  executionRules: {
    workflowId: [
      { required: true, message: "请选择工作流", trigger: "change" }
    ],
    inputParams: [
      // 输入参数改为非必填，允许为空
      { 
        validator: (rule, value, callback) => {
          // 如果值为空，直接通过验证
          if (!value || value.trim() === '') {
            callback();
            return;
          }
          try {
            JSON.parse(value);
            callback();
          } catch (e) {
            callback(new Error('输入参数必须是有效的JSON格式'));
          }
        }, 
        trigger: "blur" 
      }
    ]
  }
});

const { executionForm, historyDetailForm, historyQueryParams, executionRules } = toRefs(data);

/** 获取启用的工作流列表 */
function getEnabledWorkflowList() {
  getEnabledWorkflows().then(response => {
    enabledWorkflows.value = response || [];
  });
}

/** 获取执行历史列表 */
function getHistoryList() {
  historyLoading.value = true;
  listWorkflowExecutions(historyQueryParams.value).then(response => {
    historyList.value = response.rows.map(item => {
      // 添加工作流名称映射
      const workflow = enabledWorkflows.value.find(w => w.id === item.workflowId);
      return {
        ...item,
        workflowName: workflow ? workflow.name : `工作流${item.workflowId}`,
        // 映射后端状态值到前端状态值
        status: mapBackendStatus(item.status)
      };
    });
    historyTotal.value = response.total;
    historyLoading.value = false;
  });
}

/** 工作流选择变化 */
function handleWorkflowChange(workflowId) {
  if (workflowId) {
    getWorkflow(workflowId).then(response => {
      selectedWorkflow.value = response;
      // 获取工作流步骤，生成动态输入字段
      getWorkflowStepsAndGenerateInputs(workflowId);
    });
  } else {
    selectedWorkflow.value = {};
    workflowSteps.value = [];
    inputFields.value = [];
    executionForm.value.dynamicInputs = {};
  }
}

/** 获取工作流步骤并生成输入字段 */
function getWorkflowStepsAndGenerateInputs(workflowId) {
  listStepsByWorkflowId(workflowId).then(response => {
    workflowSteps.value = response || [];
    
    // 获取第一个步骤的输入变量
    if (workflowSteps.value.length > 0) {
      const firstStep = workflowSteps.value[0];
      generateInputFields(firstStep);
    }
  }).catch(error => {
    console.error('获取工作流步骤失败:', error);
    workflowSteps.value = [];
    inputFields.value = [];
  });
}

/** 根据第一个步骤生成输入字段 */
function generateInputFields(firstStep) {
  inputFields.value = [];
  executionForm.value.dynamicInputs = {};
  
  if (firstStep && firstStep.inputVariable) {
    try {
      let inputVariables;
      
      // 尝试解析为JSON对象
      try {
        inputVariables = JSON.parse(firstStep.inputVariable);
      } catch (jsonError) {
        // 如果JSON解析失败，可能是简单的字符串或逗号分隔的字符串
        const inputStr = firstStep.inputVariable.trim();
        
        if (inputStr.includes(',')) {
          // 处理逗号分隔的字符串，如 "input_text,user_name,age"
          const keys = inputStr.split(',').map(key => key.trim()).filter(key => key);
          inputVariables = {};
          keys.forEach(key => {
            inputVariables[key] = ''; // 默认为空字符串
          });
        } else {
          // 处理单个字符串，如 "input_text"
          inputVariables = {};
          inputVariables[inputStr] = '';
        }
      }
      
      // 如果是对象，遍历其属性生成字段
      if (typeof inputVariables === 'object' && inputVariables !== null && !Array.isArray(inputVariables)) {
        Object.keys(inputVariables).forEach(key => {
          const field = {
            key: key,
            label: key,
            type: 'text', // 默认为文本类型
            placeholder: `请输入${key}`,
            required: false // 改为非必填
          };
          
          // 根据值的类型推断输入类型
          const value = inputVariables[key];
          if (typeof value === 'number') {
            field.type = 'number';
            executionForm.value.dynamicInputs[key] = value;
          } else if (typeof value === 'boolean') {
            field.type = 'switch';
            executionForm.value.dynamicInputs[key] = value;
          } else if (Array.isArray(value)) {
            field.type = 'textarea';
            field.placeholder = `请输入${key}（JSON数组格式）`;
            executionForm.value.dynamicInputs[key] = JSON.stringify(value, null, 2);
          } else if (typeof value === 'object' && value !== null) {
            field.type = 'textarea';
            field.placeholder = `请输入${key}（JSON对象格式）`;
            executionForm.value.dynamicInputs[key] = JSON.stringify(value, null, 2);
          } else {
            // 字符串或其他类型
            executionForm.value.dynamicInputs[key] = value || '';
          }
          
          inputFields.value.push(field);
        });
      } else if (Array.isArray(inputVariables)) {
        // 如果是数组，将每个元素作为字段名
        inputVariables.forEach(key => {
          if (typeof key === 'string') {
            const field = {
              key: key,
              label: key,
              type: 'text',
              placeholder: `请输入${key}`,
              required: false // 改为非必填
            };
            inputFields.value.push(field);
            executionForm.value.dynamicInputs[key] = '';
          }
        });
      }
    } catch (error) {
      console.error('解析输入变量失败:', error);
      // 如果所有解析都失败，回退到原始JSON输入方式
      inputFields.value = [];
      proxy.$modal.msgWarning(`无法解析工作流步骤的输入变量格式，请手动编辑JSON参数。原始值：${firstStep.inputVariable}`);
    }
  }
  
  // 更新输入参数JSON
  updateInputParamsFromDynamicInputs();
}

/** 从动态输入更新JSON参数 */
function updateInputParamsFromDynamicInputs() {
  const params = {};
  
  inputFields.value.forEach(field => {
    const value = executionForm.value.dynamicInputs[field.key];
    
    if (value !== '' && value !== null && value !== undefined) {
      if (field.type === 'number') {
        params[field.key] = Number(value);
      } else if (field.type === 'switch') {
        params[field.key] = Boolean(value);
      } else if (field.type === 'textarea' && (field.placeholder.includes('JSON') || field.placeholder.includes('数组'))) {
        try {
          params[field.key] = JSON.parse(value);
        } catch (e) {
          params[field.key] = value; // 如果解析失败，保持原始字符串
        }
      } else {
        params[field.key] = value;
      }
    }
  });
  
  executionForm.value.inputParams = JSON.stringify(params, null, 2);
}

/** 动态输入字段值变化处理 */
function handleDynamicInputChange() {
  updateInputParamsFromDynamicInputs();
}

/** 执行工作流 */
function handleExecute() {
  proxy.$refs["executionRef"].validate(valid => {
    if (valid) {
      executing.value = true;
      
      // 解析输入参数JSON字符串为对象
      let inputData = {};
      try {
        inputData = JSON.parse(executionForm.value.inputParams);
      } catch (e) {
        proxy.$modal.msgError("输入参数格式错误，请输入有效的JSON格式");
        executing.value = false;
        return;
      }
      
      let executePromise;
      if (executionForm.value.executionMode === 'quick') {
        // 快速执行：直接传递workflowId和inputData
        executePromise = quickExecuteWorkflow(executionForm.value.workflowId, inputData);
      } else {
        // 普通执行：构造WorkflowExecuteRequest对象
        const params = {
          workflowId: executionForm.value.workflowId,
          inputData: inputData,
          async: false
        };
        executePromise = executeWorkflow(params);
      }
      
      executePromise.then(response => {
        executionResult.value = {
          success: true,
          message: '执行成功',
          output: response.output,
          executionId: response.executionId,
          executionTime: response.executionTime
        };
        executing.value = false;
        // 刷新历史列表
        getHistoryList();
      }).catch(() => {
        executionResult.value = {
          success: false,
          message: '执行失败'
        };
        executing.value = false;
      });
    }
  });
}

/** 重置执行表单 */
function resetExecutionForm() {
  executionForm.value = {
    workflowId: null,
    inputParams: '{}',
    executionMode: 'normal'
  };
  selectedWorkflow.value = {};
  executionResult.value = null;
  proxy.resetForm("executionRef");
}

/** 查看工作流步骤 */
function viewWorkflowSteps() {
  router.push({
    path: '/ai/workflowStep',
    query: { workflowId: selectedWorkflow.value.id }
  });
}

/** 搜索执行历史 */
function handleHistoryQuery() {
  historyQueryParams.value.pageNum = 1;
  getHistoryList();
}

/** 重置历史查询 */
function resetHistoryQuery() {
  proxy.resetForm("historyQueryRef");
  handleHistoryQuery();
}

/** 刷新历史 */
function refreshHistory() {
  getHistoryList();
}

// 历史记录多选框选中数据
function handleHistorySelectionChange(selection) {
  historyIds.value = selection.map(item => item.id);
  historyMultiple.value = !selection.length;
}

/** 历史详情 */
function handleHistoryDetail(row) {
  getWorkflowExecution(row.id).then(response => {
    // 添加工作流名称映射
    const workflow = enabledWorkflows.value.find(w => w.id === response.workflowId);
    historyDetailForm.value = {
      ...response,
      workflowName: workflow ? workflow.name : `工作流${response.workflowId}`,
      // 映射后端状态值到前端状态值
      status: mapBackendStatus(response.status)
    };
    historyDetailOpen.value = true;
  });
}

/** 删除执行历史 */
function handleDeleteHistory(row) {
  const _ids = row.id || historyIds.value;
  proxy.$modal.confirm('是否确认删除执行历史编号为"' + _ids + '"的数据项？').then(function() {
    return delWorkflowExecution(_ids);
  }).then(() => {
    getHistoryList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 映射后端状态值到前端状态值 */
function mapBackendStatus(backendStatus) {
  const statusMap = {
    'completed': 'success',
    'failed': 'failed',
    'running': 'running'
  };
  return statusMap[backendStatus] || backendStatus;
}

/** 获取状态类型 */
function getStatusType(status) {
  const statusMap = {
    'success': 'success',
    'failed': 'danger',
    'running': 'warning'
  };
  return statusMap[status] || 'info';
}

/** 获取状态文本 */
function getStatusText(status) {
  const statusMap = {
    'success': '成功',
    'failed': '失败',
    'running': '执行中'
  };
  return statusMap[status] || '未知';
}

/** 获取工作流变量信息 */
async function getWorkflowVariableInfo(workflowId) {
  try {
    const response = await getWorkflowVariables(workflowId);
    return response || [];
  } catch (error) {
    console.error('获取工作流变量失败:', error);
    return [];
  }
}

/** 复制执行结果 */
function copyResult() {
  if (!executionResult.value) return;
  
  let copyText = '';
  
  // 添加基本信息
  copyText += `执行结果: ${executionResult.value.success ? '成功' : '失败'}\n`;
  copyText += `消息: ${executionResult.value.message}\n`;
  
  if (executionResult.value.executionId) {
    copyText += `执行ID: ${executionResult.value.executionId}\n`;
  }
  
  if (executionResult.value.executionTime) {
    copyText += `执行时间: ${executionResult.value.executionTime}ms\n`;
  }
  
  // 添加步骤结果
  if (executionResult.value.stepResults && executionResult.value.stepResults.length > 0) {
    copyText += '\n步骤执行详情:\n';
    executionResult.value.stepResults.forEach((step, index) => {
      copyText += `${index + 1}. ${step.stepName}: ${step.success ? '成功' : '失败'}\n`;
      if (step.output) {
        copyText += `   输出: ${step.output}\n`;
      }
      if (step.error) {
        copyText += `   错误: ${step.error}\n`;
      }
    });
  }
  
  // 添加最终输出
  if (executionResult.value.output) {
    copyText += `\n最终输出:\n${executionResult.value.output}\n`;
  }
  
  // 添加错误信息
  if (executionResult.value.error) {
    copyText += `\n错误信息:\n${executionResult.value.error}\n`;
  }
  
  // 复制到剪贴板
  navigator.clipboard.writeText(copyText).then(() => {
    proxy.$modal.msgSuccess('执行结果已复制到剪贴板');
  }).catch(() => {
    proxy.$modal.msgError('复制失败，请手动复制');
  });
}

/** 显示变量帮助 */
function showVariableHelp() {
  proxy.$modal.alert(`
    <div style="text-align: left;">
      <h4>变量使用说明：</h4>
      <p>在输入参数中，您可以使用以下格式的变量：</p>
      <ul>
        <li><code>{{variable_name}}</code> - 基本变量引用</li>
        <li><code>{{step_name.output}}</code> - 引用特定步骤的输出</li>
        <li><code>{{user_input}}</code> - 用户输入变量</li>
      </ul>
      <h4>示例：</h4>
      <pre>{
  "user_name": "{{user_input}}",
  "previous_result": "{{step1.output}}",
  "template": "Hello {{name}}, welcome!"
}</pre>
      <p><strong>注意：</strong>变量名区分大小写，请确保变量名与工作流步骤中定义的变量名一致。</p>
    </div>
  `, '变量使用帮助', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '知道了'
  });
}

onMounted(() => {
  getEnabledWorkflowList();
  getHistoryList();
});
</script>

<style scoped>
.execution-card {
  height: 100%;
}

.workflow-info-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.execution-result {
  margin-top: 20px;
}

.result-output {
  margin-top: 15px;
}

.result-output pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.execution-info {
  margin-top: 10px;
}

.execution-info p {
  margin: 5px 0;
}

.mt20 {
  margin-top: 20px;
}

.dynamic-inputs {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid #e9ecef;
}

.dynamic-inputs .el-divider {
  margin: 0 0 16px 0;
}

.dynamic-inputs .el-form-item {
  margin-bottom: 16px;
}

.dynamic-inputs .el-form-item:last-child {
  margin-bottom: 0;
}

.input-tips {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  color: #1e40af;
}

.input-tips .el-icon {
  margin-right: 4px;
}

/* 执行结果相关样式 */
.step-results {
  margin: 16px 0;
}

.step-result-card {
  margin-bottom: 8px;
  border-left: 4px solid #409eff;
}

.step-result-card .el-card__body {
  padding: 16px;
}

.step-output-content, .step-error-content {
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.step-error-content {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.output-card, .error-card {
  margin-top: 8px;
}

.result-output-content {
  background-color: #f0f9ff;
  padding: 16px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #bfdbfe;
}

.result-error-content {
  background-color: #fef2f2;
  padding: 16px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.text-sm {
  font-size: 14px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-600 {
  color: #6b7280;
}

.text-gray-500 {
  color: #9ca3af;
}

.text-red-600 {
  color: #dc2626;
}
</style>