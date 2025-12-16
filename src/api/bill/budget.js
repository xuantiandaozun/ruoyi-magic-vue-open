import request from '@/utils/request'

// 查询预算列表
export function listBudget(query) {
    return request({
        url: '/bill/budget/list',
        method: 'get',
        params: query
    })
}

// 查询用户预算
export function getUserBudget(query) {
    return request({
        url: '/bill/budget/user',
        method: 'get',
        params: query
    })
}

// 查询家庭组预算
export function getFamilyBudget(query) {
    return request({
        url: '/bill/budget/family',
        method: 'get',
        params: query
    })
}

// 查询预算详细
export function getBudget(budgetId) {
    return request({
        url: '/bill/budget/' + budgetId,
        method: 'get'
    })
}

// 新增预算
export function addBudget(data) {
    return request({
        url: '/bill/budget',
        method: 'post',
        data: data
    })
}

// 修改预算
export function updateBudget(data) {
    return request({
        url: '/bill/budget',
        method: 'put',
        data: data
    })
}

// 删除预算
export function delBudget(budgetId) {
    return request({
        url: '/bill/budget/' + budgetId,
        method: 'delete'
    })
}

// 检查预算状态
export function checkBudgetStatus(budgetId) {
    return request({
        url: '/bill/budget/status/' + budgetId,
        method: 'get'
    })
}

// 查询预算进度
export function getBudgetProgress(budgetId) {
    return request({
        url: '/bill/budget/progress/' + budgetId,
        method: 'get'
    })
}

// 刷新实际金额
export function refreshActualAmount(budgetId) {
    return request({
        url: '/bill/budget/refresh/' + budgetId,
        method: 'post'
    })
}

// 导出预算
export function exportBudget(query) {
    return request({
        url: '/bill/budget/export',
        method: 'get',
        params: query
    })
}
