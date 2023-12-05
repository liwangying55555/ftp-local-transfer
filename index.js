#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const program = require("commander");
const async = require("async");
const term = require("terminal-kit").terminal;
const ftp = require("ftp");

const inquirer = require("inquirer");
inquirer.registerPrompt(
	"search-list",
	require("inquirer-search-list")
);

const PKG = require("./package.json");
const ftpUtils = require("./ftp");

// 版本号
program
	.version(PKG.version)
	.description(
		term.blue(
			"\n一键传输本地代码到远程服务器，解放双手\n\n"
		)
	);

program
	.command("config")
	.description("展示所有配置")
	.action(function () {
		getFTPConfig();
		getConfig();
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
function getConfig() {
	const config = require("./config.json");

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
function getFTPConfig() {
	const config = require("./ftpConfig.json");

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
		.then(function (data) {
			fs.writeFileSync(
				"./ftpConfig.json",
				JSON.stringify(data)
			);
			// term("setting success\n");
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
		.then(function (data) {
			let config = require("./config.json");
			config = {
				...config,
				[data.name]: {
					distPath: data.distPath,
					ftpPath: data.ftpPath,
				},
			};

			fs.writeFileSync(
				"./config.json",
				JSON.stringify(config)
			);
		});
}

function startFTP() {
	const FTPConfig = require("./ftpConfig.json");
	const config = require("./config.json");

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
	const client = new ftp();

	client.on("ready", async function () {
		try {
			term(`---------------------------\n`);
			term.bgGreen("ftp is onReady\n");
			term(`---------------------------\n`);
			term("ftpPath: " + ftpPath + "\n");
			term("distPath: " + distPath + "\n");
			console.log();

			// 1.删除ftp目录下的所有文件
			await ftpUtils.rmPath(ftpPath, client);

			// 2.拷贝
			await ftpUtils.copyFiles(distPath, ftpPath, client);

			client.end();
		} catch (error) {
			term.red(error);
			process.exit();
		}
	});

	client.on("close", () => {
		term(`---------------------------\n`);
		term.green("transfer has done\n");
		term(`---------------------------\n`);
		process.exit();
	});
	client.on("error", function (err) {
		term.red(
			"ftp client has an error : " +
				JSON.stringify(err) +
				"\n"
		);
		process.exit();
	});
	client.connect({
		host,
		port,
		user,
		password,
		keepalive: 10000,
	});
}
