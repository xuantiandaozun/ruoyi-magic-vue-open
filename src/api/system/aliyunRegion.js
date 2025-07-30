import request from '@/utils/request'

// 同步阿里云地域到数据字典
export function syncAliyunRegions() {
  return request({
    url: '/system/aliyun/region/sync',
    method: 'post'
  })
}