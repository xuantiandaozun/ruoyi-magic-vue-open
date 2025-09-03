import request from '@/utils/request'

// 查询自媒体文章列表
export function listSocialArticle(query) {
  return request({
    url: '/article/socialArticle/list',
    method: 'get',
    params: query
  })
}

// 查询自媒体文章详细
export function getSocialArticle(articleId) {
  return request({
    url: '/article/socialArticle/' + articleId,
    method: 'get'
  })
}

// 新增自媒体文章
export function addSocialArticle(data) {
  return request({
    url: '/article/socialArticle',
    method: 'post',
    data: data
  })
}

// 修改自媒体文章
export function updateSocialArticle(data) {
  return request({
    url: '/article/socialArticle',
    method: 'put',
    data: data
  })
}

// 删除自媒体文章
export function delSocialArticle(articleId) {
  return request({
    url: '/article/socialArticle/' + articleId,
    method: 'delete'
  })
}
