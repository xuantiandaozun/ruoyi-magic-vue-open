<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="提供商" prop="provider">
        <el-input
          v-model="queryParams.provider"
          placeholder="请输入提供商"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="能力" prop="capability">
        <el-input
          v-model="queryParams.capability"
          placeholder="请输入能力"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模型" prop="model">
        <el-input
          v-model="queryParams.model"
          placeholder="请输入模型名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择状态" clearable style="width: 200px">
          <el-option label="启用" value="Y" />
          <el-option label="禁用" value="N" />
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
          v-hasPermi="['ai:modelConfig:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ai:modelConfig:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:modelConfig:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelConfigList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="提供商" align="center" prop="provider" width="120" />
      <el-table-column label="能力" align="center" prop="capability" width="120" />
      <el-table-column label="模型" align="center" prop="model" width="180" show-overflow-tooltip />
      <el-table-column label="API端点" align="center" prop="endpoint" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="enabled" width="80">
        <template #default="scope">
          <dict-tag :options="enabledOptions" :value="scope.row.enabled"/>
        </template>
      </el-table-column>
      <el-table-column label="默认" align="center" prop="isDefault" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.isDefault === 'Y' ? 'success' : 'info'">
            {{ scope.row.isDefault === 'Y' ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:modelConfig:edit']">修改</el-button>
          <el-button link type="success" icon="Setting" @click="handleSetDefault(scope.row)" v-hasPermi="['ai:modelConfig:config']">设为默认</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:modelConfig:remove']">删除</el-button>
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

    <!-- 添加或修改模型配置对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="请输入提供商，如：openai、doubao等" />
        </el-form-item>
        <el-form-item label="能力" prop="capability">
          <el-input v-model="form.capability" placeholder="请输入能力，如：chat、embedding等" />
        </el-form-item>
        <el-form-item label="模型" prop="model">
          <el-input v-model="form.model" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" type="textarea" :rows="2" placeholder="请输入API密钥" />
        </el-form-item>
        <el-form-item label="API端点" prop="endpoint">
          <el-input v-model="form.endpoint" placeholder="请输入API端点地址" />
        </el-form-item>
        <el-form-item label="扩展参数" prop="extraParams">
          <el-input v-model="form.extraParams" type="textarea" :rows="3" placeholder="请输入JSON格式的扩展参数" />
        </el-form-item>
        <el-form-item label="工具调用延时" prop="toolCallDelay">
          <el-input-number 
            v-model="form.toolCallDelay" 
            :min="0" 
            :max="10000" 
            :step="100"
            placeholder="毫秒"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #999; font-size: 12px;">毫秒，防止频率限制，默认2000ms</span>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="Y">启用</el-radio>
            <el-radio label="N">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="系统状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ModelConfig">
import { ref, reactive, toRefs, getCurrentInstance } from "vue";
import { parseTime } from "@/utils/ruoyi";
import { listModelConfigs, getModelConfig, delModelConfig, addModelConfig, updateModelConfig, setDefaultModelConfig } from "@/api/ai/modelConfig";

const { proxy } = getCurrentInstance();

const modelConfigList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    provider: null,
    capability: null,
    model: null,
    enabled: null,
  },
  rules: {
    provider: [
      { required: true, message: "提供商不能为空", trigger: "blur" }
    ],
    capability: [
      { required: true, message: "能力不能为空", trigger: "blur" }
    ],
    model: [
      { required: true, message: "模型不能为空", trigger: "blur" }
    ],
    apiKey: [
      { required: true, message: "API Key不能为空", trigger: "blur" }
    ],
    endpoint: [
      { required: true, message: "API端点不能为空", trigger: "blur" }
    ],
    enabled: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "系统状态不能为空", trigger: "change" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 状态字典选项
const enabledOptions = ref([
  { label: "启用", value: "Y" },
  { label: "禁用", value: "N" }
]);

/** 查询模型配置列表 */
function getList() {
  loading.value = true;
  listModelConfigs(queryParams.value).then(response => {
    modelConfigList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    provider: null,
    capability: null,
    model: null,
    apiKey: null,
    endpoint: null,
    extraParams: null,
    toolCallDelay: 2000,
    enabled: "Y",
    status: "0",
    remark: null
  };
  proxy.resetForm("formRef");
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
  title.value = "添加模型配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row.id || ids.value[0];
  getModelConfig(id).then(response => {
    // 调试：打印响应数据结构
    console.log('API Response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    
    // 根据响应拦截器的逻辑，response 应该直接是数据对象
    form.value = response;
    open.value = true;
    title.value = "修改模型配置";
  }).catch(error => {
    console.error('获取模型配置失败:', error);
    proxy.$modal.msgError("获取模型配置失败");
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateModelConfig(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addModelConfig(form.value).then(response => {
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
  const deleteIds = row.id ? [row.id] : ids.value;
  proxy.$modal.confirm('是否确认删除模型配置编号为"' + deleteIds + '"的数据项？').then(function() {
    return delModelConfig(deleteIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 设置默认配置 */
function handleSetDefault(row) {
  proxy.$modal.confirm('是否确认将此配置设为默认配置？').then(function() {
    return setDefaultModelConfig(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("设置成功");
  }).catch(() => {});
}

getList();
</script>