import request from '@/utils/request'

// 查询github流行榜单列表
export function listTrending(query) {
  return request({
    url: '/github/trending/list',
    method: 'get',
    params: query
  })
}

// 查询github流行榜单详细
export function getTrending(id) {
  return request({
    url: '/github/trending/' + id,
    method: 'get'
  })
}

// 新增github流行榜单
export function addTrending(data) {
  return request({
    url: '/github/trending',
    method: 'post',
    data: data
  })
}

// 修改github流行榜单
export function updateTrending(data) {
  return request({
    url: '/github/trending',
    method: 'put',
    data: data
  })
}

// 删除github流行榜单
export function delTrending(id) {
  return request({
    url: '/github/trending/' + id,
    method: 'delete'
  })
}
