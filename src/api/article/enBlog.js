import request from '@/utils/request'

// 查询英文博客列表
export function listEnBlog(query) {
  return request({
    url: '/article/enBlog/list',
    method: 'get',
    params: query
  })
}

// 查询英文博客详细
export function getEnBlog(blogId) {
  return request({
    url: '/article/enBlog/' + blogId,
    method: 'get'
  })
}

// 新增英文博客
export function addEnBlog(data) {
  return request({
    url: '/article/enBlog',
    method: 'post',
    data: data
  })
}

// 修改英文博客
export function updateEnBlog(data) {
  return request({
    url: '/article/enBlog',
    method: 'put',
    data: data
  })
}

// 删除英文博客
export function delEnBlog(blogId) {
  return request({
    url: '/article/enBlog/' + blogId,
    method: 'delete'
  })
}
