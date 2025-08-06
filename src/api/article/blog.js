import request from '@/utils/request'

// 查询文章列表列表
export function listBlog(query) {
  return request({
    url: '/article/blog/list',
    method: 'get',
    params: query
  })
}

// 查询文章列表详细
export function getBlog(blogId) {
  return request({
    url: '/article/blog/' + blogId,
    method: 'get'
  })
}

// 新增文章列表
export function addBlog(data) {
  return request({
    url: '/article/blog',
    method: 'post',
    data: data
  })
}

// 修改文章列表
export function updateBlog(data) {
  return request({
    url: '/article/blog',
    method: 'put',
    data: data
  })
}

// 删除文章列表
export function delBlog(blogId) {
  return request({
    url: '/article/blog/' + blogId,
    method: 'delete'
  })
}

// 获取飞书文档选项列表
export function getFeishuDocOptions() {
  return request({
    url: '/article/blog/feishu-docs',
    method: 'get'
  })
}
