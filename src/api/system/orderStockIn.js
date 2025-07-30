import request from '@/utils/request'

// 查询订单入库列表
export function listOrderStockIn(query) {
  return request({
    url: '/system/orderStockIn/list',
    method: 'get',
    params: query
  })
}

// 查询订单入库详细
export function getOrderStockIn(id) {
  return request({
    url: '/system/orderStockIn/' + id,
    method: 'get'
  })
}

// 新增订单入库
export function addOrderStockIn(data) {
  return request({
    url: '/system/orderStockIn',
    method: 'post',
    data: data
  })
}

// 修改订单入库
export function updateOrderStockIn(data) {
  return request({
    url: '/system/orderStockIn',
    method: 'put',
    data: data
  })
}

// 删除订单入库
export function delOrderStockIn(id) {
  return request({
    url: '/system/orderStockIn/' + id,
    method: 'delete'
  })
}
