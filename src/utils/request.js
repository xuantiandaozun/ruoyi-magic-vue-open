import axios from 'axios'
import { ElNotification , ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams, blobValidate } from '@/utils/ruoyi'
import cache from '@/plugins/cache'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'

let downloadLoadingInstance;
// 是否显示重新登录
export let isRelogin = { show: false };
// 全局请求加载框
let loadingInstance;
// 请求计数器
let requestCount = 0;

// 显示加载框
const showLoading = () => {
  if (requestCount === 0) {
    // 使用setTimeout延迟显示加载框
    setTimeout(() => {
      if (requestCount > 0) {  // 如果请求还在进行中
        ElMessage({
          message: '加载中...',
          type: 'info',
          duration: 0,
          showClose: false,
          icon: 'Loading'
        });
      }
    }, 1000);  // 1秒后检查
  }
  requestCount++;
};

// 隐藏加载框
const hideLoading = () => {
  requestCount--;
  if (requestCount === 0) {
    ElMessage.closeAll();
  }
};

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
// 创建axios实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: import.meta.env.VITE_APP_BASE_API,
  // 超时
  timeout: 10000
})

// request拦截器
service.interceptors.request.use(config => {
  // 是否需要显示加载框
  const isLoading = (config.headers || {}).isLoading !== false
  if (isLoading) {
    showLoading();
  }
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  // 是否需要防止数据重复提交
  const isRepeatSubmit = (config.headers || {}).repeatSubmit === false
  if (getToken() && !isToken) {
    config.headers['Authorization'] =  getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
  }
  // get请求映射params参数
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime()
    }
    const requestSize = Object.keys(JSON.stringify(requestObj)).length; // 请求数据大小
    const limitSize = 5 * 1024 * 1024; // 限制存放数据5M
    if (requestSize >= limitSize) {
      console.warn(`[${config.url}]: ` + '请求数据大小超出允许的5M限制，无法进行防重复提交验证。')
      return config;
    }
    const sessionObj = cache.session.getJSON('sessionObj')
    if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj)
    } else {
      const s_url = sessionObj.url;                // 请求地址
      const s_data = sessionObj.data;              // 请求数据
      const s_time = sessionObj.time;              // 请求时间
      const interval = 1000;                       // 间隔时间(ms)，小于此时间视为重复提交
      if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
        const message = '数据正在处理，请勿重复提交';
        console.warn(`[${s_url}]: ` + message)
        return Promise.reject(new Error(message))
      } else {
        cache.session.setJSON('sessionObj', requestObj)
      }
    }
  }
  return config
}, error => {
  console.log(error)
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(res => {
    // 是否需要隐藏加载框
    const isLoading = (res.config.headers || {}).isLoading !== false
    if (isLoading) {
      hideLoading();
    }
    // 是否需要返回完整响应实体
    const isFullResponse = res.config.isFullResponse === true
    // 未设置状态码则默认成功状态
    const code = res.data.code || 200;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || errorCode['default']
    // 二进制数据则直接返回
    if (res.request.responseType ===  'blob' || res.request.responseType ===  'arraybuffer') {
      return res
    }
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', { 
          confirmButtonText: '重新登录', 
          cancelButtonText: '取消', 
          type: 'warning' 
        }).then(() => {
          isRelogin.show = false;
          useUserStore().$reset();
          removeToken();
          location.reload();
        }).catch(() => {
          isRelogin.show = false;
        });
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
    } else if (code === 500) {
      ElMessage({ message: msg, type: 'error' })
      return Promise.reject(new Error(msg))
    } else if (code === 601) {
      ElMessage({ message: msg, type: 'warning' })
      return Promise.reject(new Error(msg))
    } else if (code !== 200) {
      ElNotification.error({ title: msg })
      return Promise.reject('error')
    } else {
      // 根据 isFullResponse 参数决定返回完整响应实体还是仅返回 data
      return Promise.resolve(isFullResponse ? res.data : (res.data.data || res.data))
    }
  },  error => {
    console.log('err' + error)
    // 是否需要隐藏加载框
    const isLoading = (error.config?.headers || {}).isLoading !== false
    if (isLoading) {
      hideLoading();
    }
    let { message } = error;
    if (message == "Network Error") {
      message = "后端接口连接异常";
    } else if (message.includes("timeout")) {
      message = "系统接口请求超时";
    } else if (message.includes("Request failed with status code")) {
      message = "系统接口" + message.substr(message.length - 3) + "异常";
    }
    ElMessage({ message: message, type: 'error', duration: 5 * 1000 })
    return Promise.reject(error)
  }
)

// 通用下载方法
export function download(url, params, filename, config) {
  downloadLoadingInstance = ElLoading.service({ text: "正在下载数据，请稍候", background: "rgba(0, 0, 0, 0.7)", })
  return service.post(url, params, {
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config
  }).then(async (response) => {
    try {
      // 检查响应数据是否存在
      if (!response || !response.data) {
        ElMessage.error('下载失败，响应数据为空！');
        return;
      }

      // 检查是否为Blob类型
      const isBlob = response.data && response.data.type && response.data.type !== 'application/json';
      
      if (isBlob) {
        const blob = new Blob([response.data])
        // 获取后端响应头中的文件名
        let downloadFilename = filename
        // 如果没有传入文件名，则尝试从响应头中获取
        if (!downloadFilename && response && response.headers) {
          const contentDisposition = response.headers['content-disposition']
          if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"']).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
              downloadFilename = decodeURIComponent(matches[1].replace(/['"]*/g, ''));
            }
          }
        }
        saveAs(blob, downloadFilename)
      } else {
        // 处理非Blob响应
        if (response.data instanceof Blob) {
          const resText = await response.data.text();
          try {
            const rspObj = JSON.parse(resText);
            const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
            ElMessage.error(errMsg);
          } catch (e) {
            ElMessage.error('下载失败，响应格式错误！');
          }
        } else {
          ElMessage.error('下载失败，响应类型错误！');
        }
      }
    } catch (error) {
      console.error('下载处理异常', error);
      ElMessage.error('下载文件处理异常，请联系管理员！');
    } finally {
      downloadLoadingInstance.close();
    }
  }).catch((r) => {
    console.error(r)
    ElMessage.error('下载文件出现错误，请联系管理员！')
    downloadLoadingInstance.close();
  })
}

export default service
