import chalk from 'chalk'
import ora from 'ora'
import scpClient from 'scp2'
const spinner = ora( '正在发布到生产服务器...' )
spinner.start()
scpClient.scp(
  'dist/',
  //槟榔正式
  {
    host: '47.109.155.176', // ip
    port: 22, // 端口
    username: 'root', // 登录服务器的账号
    password: '@ThMWux7KTZBden', // 登录服务器的账号
    path: '/etc/nginx/html/admin' // 发布至静态服务器的项目路径
  },
  function ( err ) {
    spinner.stop()
    if ( err ) {
      console.log( chalk.red( '发布失败.\n' ) )
      throw err
    } else {
      console.log( chalk.green( 'Success! 成功发布到生产服务器! \n' ) )
    }
  }
)
