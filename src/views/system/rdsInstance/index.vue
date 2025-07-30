<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="实例ID" prop="dbInstanceId" class="search-item">
        <el-input
          v-model="queryParams.dbInstanceId"
          placeholder="请输入实例ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="实例描述" prop="dbInstanceDescription" class="search-item">
        <el-input
          v-model="queryParams.dbInstanceDescription"
          placeholder="请输入实例描述"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="数据库类型" prop="engine" class="search-item">
        <el-select v-model="queryParams.engine" placeholder="请选择数据库类型" clearable>
          <el-option
            v-for="dict in rds_engine_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="实例状态" prop="dbInstanceStatus" class="search-item">
        <el-select v-model="queryParams.dbInstanceStatus" placeholder="请选择实例状态" clearable>
          <el-option
            v-for="dict in rds_instance_status"
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
          v-hasPermi="['system:rdsInstance:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:rdsInstance:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:rdsInstance:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:rdsInstance:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Refresh"
          @click="handleSyncAliyun"
        >同步阿里云RDS实例</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="rdsInstanceList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="实例ID" align="center" prop="dbInstanceId" />
      <el-table-column label="实例描述" align="center" prop="dbInstanceDescription" />
      <el-table-column label="数据库类型" align="center" prop="engine">
        <template #default="scope">
          <dict-tag :options="rds_engine_type" :value="scope.row.engine"/>
        </template>
      </el-table-column>
      <el-table-column label="数据库版本" align="center" prop="engineVersion" />
      <el-table-column label="实例状态" align="center" prop="dbInstanceStatus">
        <template #default="scope">
          <dict-tag :options="rds_instance_status" :value="scope.row.dbInstanceStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:rdsInstance:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:rdsInstance:remove']">删除</el-button>
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

    <!-- 添加或修改RDS实例管理对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="rdsInstanceRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="实例ID" prop="dbInstanceId">
          <el-input v-model="form.dbInstanceId" placeholder="请输入实例ID" />
        </el-form-item>
        <el-form-item label="实例描述" prop="dbInstanceDescription">
          <el-input v-model="form.dbInstanceDescription" placeholder="请输入实例描述" />
        </el-form-item>
        <el-form-item label="数据库类型" prop="engine">
          <el-select v-model="form.engine" placeholder="请选择数据库类型">
            <el-option
              v-for="dict in rds_engine_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据库版本" prop="engineVersion">
          <el-input v-model="form.engineVersion" placeholder="请输入数据库版本" />
        </el-form-item>
        <el-form-item label="实例规格" prop="dbInstanceClass">
          <el-input v-model="form.dbInstanceClass" placeholder="请输入实例规格" />
        </el-form-item>
        <el-form-item label="CPU数量" prop="dbInstanceCpu">
          <el-input v-model="form.dbInstanceCpu" placeholder="请输入CPU数量" />
        </el-form-item>
        <el-form-item label="内存大小" prop="dbInstanceMemory">
          <el-input v-model="form.dbInstanceMemory" placeholder="请输入内存大小" />
        </el-form-item>
        <el-form-item label="存储类型" prop="dbInstanceStorageType">
          <el-input v-model="form.dbInstanceStorageType" placeholder="请输入存储类型" />
        </el-form-item>
        <el-form-item label="实例系列" prop="category">
          <el-input v-model="form.category" placeholder="请输入实例系列" />
        </el-form-item>
        <el-form-item label="实例状态" prop="dbInstanceStatus">
          <el-select v-model="form.dbInstanceStatus" placeholder="请选择实例状态">
            <el-option
              v-for="dict in rds_instance_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="实例类型" prop="dbInstanceType">
          <el-select v-model="form.dbInstanceType" placeholder="请选择实例类型">
            <el-option
              v-for="dict in rds_instance_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="访问模式" prop="connectionMode">
          <el-input v-model="form.connectionMode" placeholder="请输入访问模式" />
        </el-form-item>
        <el-form-item label="连接地址" prop="connectionString">
          <el-input v-model="form.connectionString" placeholder="请输入连接地址" />
        </el-form-item>
        <el-form-item label="付费类型" prop="payType">
          <el-select v-model="form.payType" placeholder="请选择付费类型">
            <el-option
              v-for="dict in rds_pay_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="锁定状态" prop="lockMode">
          <el-input v-model="form.lockMode" placeholder="请输入锁定状态" />
        </el-form-item>
        <el-form-item label="锁定原因" prop="lockReason">
          <el-input v-model="form.lockReason" placeholder="请输入锁定原因" />
        </el-form-item>
        <el-form-item label="释放保护" prop="deletionProtection">
          <el-radio-group v-model="form.deletionProtection">
            <el-radio
              v-for="dict in sys_yes_no"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="实例创建时间" prop="instanceCreateTime">
          <el-date-picker clearable
            v-model="form.instanceCreateTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择实例创建时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="到期时间" prop="expireTime">
          <el-date-picker clearable
            v-model="form.expireTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择到期时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="销毁时间" prop="destroyTime">
          <el-date-picker clearable
            v-model="form.destroyTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择销毁时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="主实例ID" prop="masterInstanceId">
          <el-input v-model="form.masterInstanceId" placeholder="请输入主实例ID" />
        </el-form-item>
        <el-form-item label="灾备实例ID" prop="guardDbInstanceId">
          <el-input v-model="form.guardDbInstanceId" placeholder="请输入灾备实例ID" />
        </el-form-item>
        <el-form-item label="临时实例ID" prop="tempDbInstanceId">
          <el-input v-model="form.tempDbInstanceId" placeholder="请输入临时实例ID" />
        </el-form-item>
        <el-form-item label="关联的密钥表ID" prop="secretKeyId">
          <el-input v-model="form.secretKeyId" placeholder="请输入关联的密钥表ID" />
        </el-form-item>
        <el-form-item label="访问密钥" prop="accessKey">
          <el-input v-model="form.accessKey" placeholder="请输入访问密钥" />
        </el-form-item>
        <el-form-item label="密钥" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入密钥" />
        </el-form-item>
        <el-form-item label="密钥地域" prop="keyRegion">
          <el-input v-model="form.keyRegion" placeholder="请输入密钥地域" />
        </el-form-item>
        <el-form-item label="密钥状态" prop="keyStatus">
          <el-radio-group v-model="form.keyStatus">
            <el-radio
              v-for="dict in sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
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

<script setup name="RdsInstance">
import { addRdsInstance, delRdsInstance, getRdsInstance, listRdsInstance, syncAliyunRdsInstances, updateRdsInstance } from "@/api/system/rdsInstance";
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const rdsInstanceRef = ref();
const queryRef = ref();
const { rds_instance_type,rds_pay_type,rds_instance_status,rds_engine_type,sys_yes_no,sys_normal_disable } = proxy.useDict('rds_instance_type','rds_pay_type','rds_instance_status','rds_engine_type','sys_yes_no','sys_normal_disable');

const rdsInstanceList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
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
    dbInstanceId: null,
    dbInstanceDescription: null,
    engine: null,
    dbInstanceStatus: null,
  },
  rules: {
    id: [
      { required: true, message: "主键ID不能为空", trigger: "blur" }
    ],
    dbInstanceId: [
      { required: true, message: "实例ID不能为空", trigger: "blur" }
    ],
    engine: [
      { required: true, message: "数据库类型不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询RDS实例管理列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listRdsInstance(queryParams.value);
    rdsInstanceList.value = response.rows;
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
    dbInstanceId: null,
    dbInstanceDescription: null,
    engine: null,
    engineVersion: null,
    dbInstanceClass: null,
    dbInstanceCpu: null,
    dbInstanceMemory: null,
    dbInstanceStorageType: null,
    category: null,
    dbInstanceStatus: null,
    dbInstanceType: null,
    connectionMode: null,
    connectionString: null,
    payType: null,
    lockMode: null,
    lockReason: null,
    deletionProtection: null,
    instanceCreateTime: null,
    expireTime: null,
    destroyTime: null,
    masterInstanceId: null,
    guardDbInstanceId: null,
    tempDbInstanceId: null,
    secretKeyId: null,
    accessKey: null,
    secretKey: null,
    keyRegion: null,
    keyStatus: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  };
  if (rdsInstanceRef.value) {
    rdsInstanceRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
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

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加RDS实例管理";
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
    const response = await getRdsInstance(editId);
    form.value = response;
    open.value = true;
    title.value = "修改RDS实例管理";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await rdsInstanceRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.id != null) {
      await updateRdsInstance(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addRdsInstance(form.value);
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
    await delRdsInstance(deleteIds);
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
  proxy.download('system/rdsInstance/export', {
    ...queryParams.value
  }, 'rdsInstance_' + new Date().getTime() + '.xlsx')
}

/** 同步阿里云RDS实例操作 */
async function handleSyncAliyun() {
  try {
    await proxy.$modal.confirm('是否确认同步阿里云RDS实例？此操作将从阿里云获取最新的RDS实例信息。');
    loading.value = true;
    await syncAliyunRdsInstances();
    proxy.$modal.msgSuccess("同步成功");
    getList(); // 重新加载列表
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作，无需提示
    } else {
      proxy.$modal.msgError("同步失败：" + error);
    }
  } finally {
    loading.value = false;
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

