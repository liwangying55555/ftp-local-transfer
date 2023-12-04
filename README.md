# transfer-by-ftp

在本地一键上传打包之后的项目文件到远程服务器，传输使用了ftp工具。

<b>tips:所有账户信息均保存配置文件中，支持一键修改。</b>

## Check List

1. ftp各项配置设置正确
2. 账户密码正确
3. 账户指向的根目录文件路径正确。

## 使用指南

```shell
# 读取配置
transfer-by-ftp config get

# 配置config
transfer-by-ftp config set
# 请配置ftp host(XXX.XXX.XXX.XX)
# 请配置端口 port(默认为21)
# 请配置用户名
# 请配置密码

# 添加项目路径
transfer-by-ftp add
# 请配置打包项目的名称
# 请配置打包项目的路径
# 请配置远程服务器目标文件夹的路径

# 开始一个ftp传输
transfer-by-ftp start
# 请选择当前传输的项目名称
# 开始
```
