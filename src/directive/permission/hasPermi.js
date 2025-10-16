/**
 * v-hasPermi 操作权限处理
 * Copyright (c) 2019 ruoyi
 */
 
import useUserStore from '@/store/modules/user'

export default {
  mounted(el, binding, vnode) {
    const { value } = binding
    const all_permission = "*:*:*";
    const userStore = useUserStore()
    const permissions = userStore.permissions

    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value

      // 检查是否为 admin 账号（用户ID为1），如果是则自动拥有所有权限
      if (userStore.id === 1 || userStore.id === '1') {
        return; // admin 账号直接通过权限验证
      }

      const hasPermissions = permissions.some(permission => {
        return all_permission === permission || permissionFlag.includes(permission)
      })

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  }
}
