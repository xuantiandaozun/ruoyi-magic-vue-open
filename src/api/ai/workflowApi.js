import request from '@/utils/request'

/**
 * AI工作流API封装
 * 封装好的工作流接口，前端直接调用即可
 */

/**
 * AI生成博客封面
 * @param {number} blogId 博客ID
 * @returns Promise
 */
export function generateBlogCover(blogId) {
    return request({
        url: `/ai/workflow/api/blog/cover/${blogId}`,
        method: 'post'
    })
}

/**
 * 批量AI生成博客封面
 * @param {number[]} blogIds 博客ID数组
 * @returns Promise
 */
export function batchGenerateBlogCover(blogIds) {
    return request({
        url: '/ai/workflow/api/blog/cover/batch',
        method: 'post',
        data: blogIds
    })
}
