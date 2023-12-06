# ftp-local-transfer

在本地一键上传打包之后的项目文件到远程服务器，传输使用了`basic-ftp`工具。

所有账户信息均保存配置文件中，支持一键修改。

## 使用指南

#### 安装

```shell
npm install -g ftp-local-transfer 
```

#### 如何在本地使用

 `config`：读取所有配置，包括ftp账户和所有需要打包项目的路径信息

```shell
# 读取所有配置
ftp-local-transfer config
```

`setFTP`：配置ftp账户

```shell
# 配置ftp账户
ftp-local-transfer setFTP
# 请配置ftp host(XXX.XXX.XXX.XX)
# 请配置用户名
# 请配置密码
```

`addPath`：添加新的打包项目路径

```shell
# 添加新的打包项目路径
ftp-local-transfer addPath
# 请配置打包项目的名称
# 请配置打包项目的路径[绝对路径]
# 请配置远程服务器目标文件夹的路径[相对路径]
```

`start`：选择一个打包项目，即可开始传输。

```shell
# 开始一个ftp传输
ftp-local-transfer start
# 请选择当前传输的项目名称
# 开始
```

## Check List

1. ftp各项配置设置正确
2. 账户密码正确
3. 账户指向的根目录文件路径正确，该ftp账户有修改权限
