import request from '@/utils/request'

// 查询飞书消息发送记录列表
export function listFeishuMessageRecord(query) {
  return request({
    url: '/system/feishu/record/list',
    method: 'get',
    params: query
  })
}

// 查询飞书消息发送记录详细
export function getFeishuMessageRecord(id) {
  return request({
    url: '/system/feishu/record/' + id,
    method: 'get'
  })
}

// 删除飞书消息发送记录
export function delFeishuMessageRecord(id) {
  return request({
    url: '/system/feishu/record/' + id,
    method: 'delete'
  })
}

// 导出飞书消息发送记录
export function exportFeishuMessageRecord(query) {
  return request({
    url: '/system/feishu/record/export',
    method: 'post',
    data: query
  })
}

// 发送文本消息
export function sendTextMessage(receiveId, receiveIdType, content, keyName) {
  return request({
    url: '/system/feishu/sendText',
    method: 'post',
    params: {
      receiveId,
      receiveIdType,
      content,
      keyName
    }
  })
}

// 发送消息（通用接口）
export function sendMessage(messageDto, keyName) {
  return request({
    url: '/system/feishu/send',
    method: 'post',
    data: messageDto,
    params: { keyName }
  })
}

// 发送富文本消息
export function sendPostMessage(receiveId, receiveIdType, title, content, keyName) {
  return request({
    url: '/system/feishu/sendPost',
    method: 'post',
    params: {
      receiveId,
      receiveIdType,
      title,
      content,
      keyName
    }
  })
}