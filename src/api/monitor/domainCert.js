import request from '@/utils/request'

// 查询域名证书监控列表
export function listDomainCert(query) {
  return request({
    url: '/monitor/cert/list',
    method: 'get',
    params: query
  })
}

// 查询域名证书监控详细
export function getDomainCert(id) {
  return request({
    url: '/monitor/cert/' + id,
    method: 'get'
  })
}

// 新增域名证书监控
export function addDomainCert(data) {
  return request({
    url: '/monitor/cert',
    method: 'post',
    data: data
  })
}

// 修改域名证书监控
export function updateDomainCert(data) {
  return request({
    url: '/monitor/cert',
    method: 'put',
    data: data
  })
}

// 删除域名证书监控
export function delDomainCert(id) {
  return request({
    url: '/monitor/cert/' + id,
    method: 'delete'
  })
}

// 检测单个域名证书
export function checkDomainCert(id) {
  return request({
    url: '/monitor/cert/check/' + id,
    method: 'post'
  })
}

// 检测所有域名证书
export function checkAllDomainCerts() {
  return request({
    url: '/monitor/cert/checkAll',
    method: 'post'
  })
}

// 发送指定域名的过期通知
export function sendNotification(id) {
  return request({
    url: '/monitor/cert/notify/' + id,
    method: 'post'
  })
}
