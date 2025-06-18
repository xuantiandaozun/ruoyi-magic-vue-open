<template>
  <div :class="{ 'hidden': hidden }" class="pagination-container">
    <el-pagination
      :background="background"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="totalNumber"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { scrollTo } from '@/utils/scroll-to'

const props = defineProps({
  total: {
    required: true,
    type: [Number, String]
  },
  page: {
    type: Number,
    default: 1
  },
  limit: {
    type: Number,
    default: 20
  },
  pageSizes: {
    type: Array,
    default() {
      return [10, 20, 30, 50]
    }
  },
  // 移动端页码按钮的数量端默认值5
  pagerCount: {
    type: Number,
    default: document.body.clientWidth < 992 ? 5 : 7
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  background: {
    type: Boolean,
    default: true
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  hidden: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits();
const currentPage = computed({
  get() {
    return props.page
  },
  set(val) {
    emit('update:page', val)
  }
})
const pageSize = computed({
  get() {
    return props.limit
  },
  set(val){
    emit('update:limit', val)
  }
})

// 确保total是数字类型
const totalNumber = computed(() => {
  return typeof props.total === 'string' ? parseInt(props.total) : props.total
})

// Add a flag to track if this is the first load
const isFirstLoad = ref(true)

function handleSizeChange(val) {
  if (currentPage.value * val > totalNumber.value) {
    currentPage.value = 1
  }
  // Only emit if not first load
  if (!isFirstLoad.value) {
    emit('pagination', { page: currentPage.value, limit: val })
  }
  isFirstLoad.value = false
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}

function handleCurrentChange(val) {
  // Only emit if not first load
  if (!isFirstLoad.value) {
    emit('pagination', { page: val, limit: pageSize.value })
  }
  isFirstLoad.value = false
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}

</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 16px 16px; /* 修改这里，将上下内边距从32px减少到16px */
}
.pagination-container.hidden {
  display: none;
}
</style>