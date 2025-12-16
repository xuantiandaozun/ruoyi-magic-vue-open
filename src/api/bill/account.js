import request from '@/utils/request'

// 查询账户列表
export function listAccount(query) {
    return request({
        url: '/bill/account/list',
        method: 'get',
        params: query
    })
}

// 查询用户账户列表
export function getUserAccounts(userId) {
    return request({
        url: '/bill/account/user/' + userId,
        method: 'get'
    })
}

// 查询账户详细
export function getAccount(accountId) {
    return request({
        url: '/bill/account/' + accountId,
        method: 'get'
    })
}

// 新增账户
export function addAccount(data) {
    return request({
        url: '/bill/account',
        method: 'post',
        data: data
    })
}

// 修改账户
export function updateAccount(data) {
    return request({
        url: '/bill/account',
        method: 'put',
        data: data
    })
}

// 删除账户
export function delAccount(accountId) {
    return request({
        url: '/bill/account/' + accountId,
        method: 'delete'
    })
}

// 更新账户余额
export function updateBalance(accountId, balance) {
    return request({
        url: '/bill/account/balance/' + accountId,
        method: 'put',
        data: { balance: balance }
    })
}

// 查询总资产
export function getTotalAssets(userId) {
    return request({
        url: '/bill/account/totalAssets/' + userId,
        method: 'get'
    })
}

// 导出账户
export function exportAccount(query) {
    return request({
        url: '/bill/account/export',
        method: 'get',
        params: query
    })
}
