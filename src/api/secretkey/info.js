import request from '@/utils/request'

// 查询密钥管理列表
export function listSecretKey(query) {
    return request({
        url: '/secretkey/info/list',
        method: 'get',
        params: query
    })
}

// 查询密钥管理详细
export function getSecretKey(id) {
    return request({
        url: '/secretkey/info/' + id,
        method: 'get'
    })
}

// 新增密钥管理
export function addSecretKey(data) {
    return request({
        url: '/secretkey/info',
        method: 'post',
        data: data
    })
}

// 修改密钥管理
export function updateSecretKey(data) {
    return request({
        url: '/secretkey/info',
        method: 'put',
        data: data
    })
}

// 删除密钥管理
export function delSecretKey(id) {
    return request({
        url: '/secretkey/info/' + id,
        method: 'delete'
    })
}

// 获取飞书密钥下拉选项
export function getFeishuSecretKeyOptions() {
    return request({
        url: '/secretkey/info/feishu/options',
        method: 'get'
    })
}
