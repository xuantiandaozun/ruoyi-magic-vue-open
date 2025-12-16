import request from '@/utils/request'

// 查询账单记录列表
export function listRecord(query) {
    return request({
        url: '/bill/record/list',
        method: 'get',
        params: query
    })
}

// 查询账单记录详细
export function getRecord(recordId) {
    return request({
        url: '/bill/record/' + recordId,
        method: 'get'
    })
}

// 新增账单记录
export function addRecord(data) {
    return request({
        url: '/bill/record',
        method: 'post',
        data: data
    })
}

// 修改账单记录
export function updateRecord(data) {
    return request({
        url: '/bill/record',
        method: 'put',
        data: data
    })
}

// 删除账单记录
export function delRecord(recordId) {
    return request({
        url: '/bill/record/' + recordId,
        method: 'delete'
    })
}

// 导出账单记录
export function exportRecord(query) {
    return request({
        url: '/bill/record/export',
        method: 'get',
        params: query
    })
}

// 获取用户统计
export function getUserStatistics(query) {
    return request({
        url: '/bill/record/statistics',
        method: 'get',
        params: query
    })
}

// 获取家庭组统计
export function getFamilyStatistics(query) {
    return request({
        url: '/bill/record/statistics/family',
        method: 'get',
        params: query
    })
}

// 获取分类统计
export function getCategoryStatistics(query) {
    return request({
        url: '/bill/record/statistics/category',
        method: 'get',
        params: query
    })
}
