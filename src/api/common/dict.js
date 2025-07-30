import request from '@/utils/request'

/**
 * 通用字典查询API
 * 基础路径: /common/dict
 * 权限要求: common:dict:query
 */

// 获取表字典数据 (简单查询)
export function getTableDict(tableName, params = {}) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    // 构建查询参数
    const queryParams = {}
    if (params.labelField) {
        queryParams.labelField = params.labelField
    }
    if (params.valueField) {
        queryParams.valueField = params.valueField
    }
    if (params.status !== undefined) {
        queryParams.status = params.status
    }

    return request({
        url: `/common/dict/table/${tableName}`,
        method: 'get',
        params: queryParams
    })
}

// 获取自定义表字典数据 (复杂查询)
export function getCustomTableDict(tableName, queryRequest) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    if (!queryRequest || typeof queryRequest !== 'object') {
        return Promise.reject(new Error('查询请求对象不能为空'))
    }

    // 构建请求数据
    const requestData = {
        labelField: queryRequest.labelField,
        valueField: queryRequest.valueField,
        status: queryRequest.status,
        includeFullData: queryRequest.includeFullData || false,
        conditions: queryRequest.conditions || {},
        orderBy: queryRequest.orderBy,
        orderDirection: queryRequest.orderDirection
    }

    return request({
        url: `/common/dict/table/${tableName}/custom`,
        method: 'post',
        data: requestData
    });
}

// 分页获取表字典数据
export function getTableDictPage(tableName, queryRequest) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    if (!queryRequest || typeof queryRequest !== 'object') {
        return Promise.reject(new Error('查询请求对象不能为空'))
    }

    // 构建请求数据，包含分页信息
    const requestData = {
        labelField: queryRequest.labelField,
        valueField: queryRequest.valueField,
        status: queryRequest.status,
        conditions: queryRequest.conditions || {},
        orderBy: queryRequest.orderBy,
        orderDirection: queryRequest.orderDirection || 'ASC',
        pageNum: queryRequest.pageNum || 1,
        pageSize: queryRequest.pageSize || 10
    }

    return request({
        url: `/common/dict/table/${tableName}/page`,
        method: 'post',
        data: requestData
    })
}

// 验证表是否存在
export function checkTableExists(tableName) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    return request({
        url: `/common/dict/table/${tableName}/exists`,
        method: 'get'
    })
}

// 获取表的列信息
export function getTableColumns(tableName) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    return request({
        url: `/common/dict/table/${tableName}/columns`,
        method: 'get'
    })
}

// 获取表的默认字段映射
export function getTableDefaultFields(tableName) {
    // 参数验证
    if (!tableName || typeof tableName !== 'string') {
        return Promise.reject(new Error('表名不能为空且必须为字符串'))
    }

    return request({
        url: `/common/dict/table/${tableName}/default-fields`,
        method: 'get'
    })
}