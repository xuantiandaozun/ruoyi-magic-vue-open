import request from '@/utils/request'

// 查询账单分类列表
export function listCategory(query) {
    return request({
        url: '/bill/category/list',
        method: 'get',
        params: query
    })
}

// 查询账单分类树
export function getCategoryTree(categoryType) {
    return request({
        url: '/bill/category/tree/' + categoryType,
        method: 'get'
    })
}

// 查询一级分类
export function getFirstLevelCategories(categoryType) {
    return request({
        url: '/bill/category/firstLevel/' + categoryType,
        method: 'get'
    })
}

// 查询二级分类
export function getSecondLevelCategories(parentId) {
    return request({
        url: '/bill/category/secondLevel/' + parentId,
        method: 'get'
    })
}

// 查询账单分类详细
export function getCategory(categoryId) {
    return request({
        url: '/bill/category/' + categoryId,
        method: 'get'
    })
}

// 新增账单分类
export function addCategory(data) {
    return request({
        url: '/bill/category',
        method: 'post',
        data: data
    })
}

// 修改账单分类
export function updateCategory(data) {
    return request({
        url: '/bill/category',
        method: 'put',
        data: data
    })
}

// 删除账单分类
export function delCategory(categoryId) {
    return request({
        url: '/bill/category/' + categoryId,
        method: 'delete'
    })
}

// 导出账单分类
export function exportCategory(query) {
    return request({
        url: '/bill/category/export',
        method: 'get',
        params: query
    })
}
