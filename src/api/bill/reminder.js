import request from '@/utils/request'

// 查询提醒列表
export function listReminder(query) {
    return request({
        url: '/bill/reminder/list',
        method: 'get',
        params: query
    })
}

// 查询用户提醒列表
export function getUserReminders(userId) {
    return request({
        url: '/bill/reminder/user/' + userId,
        method: 'get'
    })
}

// 查询已启用的提醒
export function getEnabledReminders(userId) {
    return request({
        url: '/bill/reminder/enabled/' + userId,
        method: 'get'
    })
}

// 查询提醒详细
export function getReminder(reminderId) {
    return request({
        url: '/bill/reminder/' + reminderId,
        method: 'get'
    })
}

// 新增提醒
export function addReminder(data) {
    return request({
        url: '/bill/reminder',
        method: 'post',
        data: data
    })
}

// 修改提醒
export function updateReminder(data) {
    return request({
        url: '/bill/reminder',
        method: 'put',
        data: data
    })
}

// 删除提醒
export function delReminder(reminderId) {
    return request({
        url: '/bill/reminder/' + reminderId,
        method: 'delete'
    })
}

// 启用/禁用提醒
export function toggleReminder(reminderId, enabled) {
    return request({
        url: '/bill/reminder/toggle/' + reminderId,
        method: 'put',
        params: { enabled: enabled }
    })
}

// 批量启用提醒
export function batchEnableReminders(reminderIds) {
    return request({
        url: '/bill/reminder/batchEnable',
        method: 'put',
        data: reminderIds
    })
}

// 批量禁用提醒
export function batchDisableReminders(reminderIds) {
    return request({
        url: '/bill/reminder/batchDisable',
        method: 'put',
        data: reminderIds
    })
}

// 批量删除提醒
export function batchDelReminders(reminderIds) {
    return request({
        url: '/bill/reminder/batchDelete',
        method: 'delete',
        data: reminderIds
    })
}

// 导出提醒
export function exportReminder(query) {
    return request({
        url: '/bill/reminder/export',
        method: 'get',
        params: query
    })
}
