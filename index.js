#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const program = require("commander");
const term = require("terminal-kit").terminal;
const ftp = require("basic-ftp");

const inquirer = require("inquirer");
inquirer.registerPrompt(
	"search-list",
	require("inquirer-search-list")
);

const PKG = require("./package.json");
const ftpUtils = require("./ftp");
const configPath = "/config";
const ftpConfig = "/ftpConfig.json";
const pathConfig = "/pathConfig.json";

// 版本号
program
	.version(PKG.version)
	.description(
		term.green(
			"\n一键传输本地代码到远程服务器，解放双手\n\n"
		)
	);

program
	.command("config")
	.description("展示所有配置")
	.action(async function () {
		await getFTPConfig();
		await getConfig();
	});

program
	.command("setFTP")
	.description("设置FTP配置")
	.action(setFTPConfig);

program
	.command("addPath")
	.description("添加项目路径")
	.action(addProject);

program
	.command("start")
	.description("开始一个新的ftp传输")
	.action(startFTP);

program.parse(process.argv);

/** ------------------------------------------------- */

// 读取项目配置信息
async function getConfig() {
	const config = await readFile(pathConfig);

	const data = [
		["distPath[本地目录]", "ftpPath[远程服务器目录]"],
	];
	Object.keys(config).forEach(function (name) {
		data.push([
			config[name].distPath,
			config[name].ftpPath,
		]);
	});
	term.table(data, {
		hasBorder: false,
		width: 100,
	});
}

// 读取ftp配置
async function getFTPConfig() {
	const config = await readFile(ftpConfig);

	for (let name in config) {
		const item = config[name];
		term(name + " = " + item + "\n");
	}
	term("\n");
}

function setFTPConfig() {
	inquirer
		.prompt([
			{
				type: "input",
				name: "host",
				message: "请配置ftp host(XXX.XXX.XXX.XXX)",
				validate: value => value.trim() !== "",
			},
			{
				type: "input",
				name: "port",
				message: "请配置端口 port",
				default: "21",
			},
			{
				type: "input",
				name: "user",
				message: "请配置用户名",
				validate: value => value.trim() !== "",
			},
			{
				type: "input",
				name: "password",
				message: "请配置密码",
				validate: value => value.trim() !== "",
			},
		])
		.then(async function (data) {
			// 初始化path
			await readFile(ftpConfig);

			// 写入
			fs.writeFileSync(
				path.join(__dirname, configPath, ftpConfig),
				JSON.stringify(data)
			);
		});
}

function addProject() {
	inquirer
		.prompt([
			{
				type: "input",
				name: "name",
				message: "请配置打包项目的名称",
				validate: value => value.trim() !== "",
			},
			{
				type: "input",
				name: "distPath",
				message: "请配置打包项目的路径[绝对路径]",
				validate: value => value.trim() !== "",
			},
			{
				type: "input",
				name: "ftpPath",
				message:
					"请配置远程服务器目标文件夹的路径[相对路径]",
				validate: value => value.trim() !== "",
			},
		])
		.then(async function (data) {
			let config = await readFile(pathConfig);
			config = {
				...config,
				[data.name]: {
					distPath: data.distPath,
					ftpPath: data.ftpPath,
				},
			};

			fs.writeFileSync(
				path.join(__dirname, configPath, pathConfig),
				JSON.stringify(config)
			);
		});
}

async function startFTP() {
	const FTPConfig = await readFile(ftpConfig);
	const config = await readFile(pathConfig);

	for (let key in FTPConfig) {
		if (!FTPConfig[key]) {
			return term.red("请先配置FTP账户信息");
		}
	}

	if (!Object.keys(config).length) {
		return term.red("请先添加传输的项目地址");
	}

	inquirer
		.prompt([
			{
				type: "search-list",
				name: "app",
				message: "请输入当前传输的项目名称(支持模糊搜索)",
				choices: Object.keys(config).map(function (name) {
					return {
						name: name,
						value: name,
					};
				}),
			},
		])
		.then(function ({ app }) {
			connectFTP({
				...FTPConfig,
				...config[app],
			});
		});
}

/**
 * 1.连接ftp
 * 2.读取路径下的文件
 * 3.删除文件夹
 * 4.新建文件夹
 * 5.cwd新路径
 * 6.拷贝dist路径下的所有文件
 * 7.关闭连接
 */
async function connectFTP({
	host,
	port,
	user,
	password,
	distPath,
	ftpPath,
}) {
	const client = new ftp.Client();
	client.ftp.verbose = false;

	try {
		await client.access({
			host,
			user,
			password,
		});

		term(`---------------------------\n`);
		term.green("ftp is onReady\n");
		term(`---------------------------\n`);
		term("ftpPath: " + ftpPath + "\n");
		term("distPath: " + distPath + "\n\n");

		await term.spinner("unboxing-color");
		term(" uploading...");

		// 一键拷贝 递归什么的都不需要了
		await client.uploadFromDir(distPath, ftpPath);
	} catch (error) {
		term.red(
			"\n\nftp client has an error : " +
				JSON.stringify(error) +
				"\n"
		);
		process.exit();
	}

	client.close();

	term(`\n\n---------------------------\n`);
	term.green("transfer has done\n");
	term(`---------------------------\n`);
	process.exit();
}

function readDir() {
	return new Promise(function (resolve) {
		fs.readdir(
			path.join(__dirname, configPath),
			function (err, files) {
				if (err) {
					resolve(
						fs.mkdirSync(path.join(__dirname, configPath))
					);
				} else {
					resolve(files);
				}
			}
		);
	});
}

function checkFile(fileName) {
	return new Promise(function (resolve) {
		fs.readFile(
			path.join(__dirname, configPath, fileName),
			"utf8",
			function (err, file) {
				if (err) {
					resolve(
						fs.writeFileSync(
							path.join(__dirname, configPath, fileName),
							JSON.stringify(
								fileName === ftpConfig
									? {
											host: "",
											post: "",
											user: "",
											password: "",
									  }
									: {}
							)
						)
					);
				} else {
					resolve(file);
				}
			}
		);
	});
}

async function readFile(fileName) {
	// 查询文件夹，没有则新增
	const dir = await readDir();
	if (dir) {
		// 查询文件，没有则新增
		const file = await checkFile(fileName);
		if (file) {
			return JSON.parse(file);
		} else {
			return readFile(fileName);
		}
	} else {
		return readFile(fileName);
	}
}
