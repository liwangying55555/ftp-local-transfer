# ftp-local-transfer

在本地一键上传打包之后的项目文件到远程服务器，传输使用了ftp工具。

所有账户信息均保存配置文件中，支持一键修改。

## Check List

1. ftp各项配置设置正确
2. 账户密码正确
3. 账户指向的根目录文件路径正确，该ftp账户有修改权限

## 使用指南

```shell
# 读取配置
ftp-local-transfer config

# 配置ftp设置
ftp-local-transfer setFTP
# 请配置ftp host(XXX.XXX.XXX.XX)
# 请配置端口 port(默认为21)
# 请配置用户名
# 请配置密码

# 添加项目路径
ftp-local-transfer addPath
# 请配置打包项目的名称
# 请配置打包项目的路径[绝对路径]
# 请配置远程服务器目标文件夹的路径[相对路径]

# 开始一个ftp传输
ftp-local-transfer start
# 请选择当前传输的项目名称
# 开始
```
