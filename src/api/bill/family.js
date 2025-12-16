import request from '@/utils/request'

// 查询家庭组列表
export function listFamily(query) {
    return request({
        url: '/bill/family/list',
        method: 'get',
        params: query
    })
}

// 查询家庭组详细
export function getFamily(familyId) {
    return request({
        url: '/bill/family/' + familyId,
        method: 'get'
    })
}

// 新增家庭组
export function addFamily(data) {
    return request({
        url: '/bill/family',
        method: 'post',
        data: data
    })
}

// 修改家庭组
export function updateFamily(data) {
    return request({
        url: '/bill/family',
        method: 'put',
        data: data
    })
}

// 删除家庭组
export function delFamily(familyId) {
    return request({
        url: '/bill/family/' + familyId,
        method: 'delete'
    })
}

// 生成邀请码
export function generateInviteCode() {
    return request({
        url: '/bill/family/generateInviteCode',
        method: 'post'
    })
}

// 根据邀请码查询家庭组
export function getFamilyByInviteCode(inviteCode) {
    return request({
        url: '/bill/family/inviteCode/' + inviteCode,
        method: 'get'
    })
}

// 加入家庭组
export function joinFamily(inviteCode) {
    return request({
        url: '/bill/family/join/' + inviteCode,
        method: 'post'
    })
}

// 退出家庭组
export function leaveFamily(familyId) {
    return request({
        url: '/bill/family/leave/' + familyId,
        method: 'post'
    })
}

// 导出家庭组
export function exportFamily(query) {
    return request({
        url: '/bill/family/export',
        method: 'get',
        params: query
    })
}
