const fs = require("fs");
const path = require("path");
const term = require("terminal-kit").terminal;

async function initClient(client) {
	client = client;
}

// 切换到指定路径下
function cwd(dirPath, client) {
	return new Promise((resolve, reject) => {
		client.cwd(dirPath, (err, dir) => {
			if (err) {
				reject(err);
			}
			resolve(dir);
		});
	});
}

// 读取文件列表
async function list(dirPath, client) {
	await cwd(dirPath, client);
	return new Promise((resolve, reject) => {
		client.list((err, files) => {
			if (err) {
				reject(err);
			}
			resolve(files);
		});
	});
}

// 删除指定文件
function dele(dirPath, client) {
	return new Promise((resolve, reject) => {
		client.delete(dirPath, err => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

// 删除空文件夹
async function rmdir(dirPath, client) {
	return new Promise((resolve, reject) => {
		client.rmdir(dirPath, err => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

/**
 * 将文件上传到ftp目标地址
 * @param {string} src 拷贝文件的路径
 * @param {string} dest 目标路径
 */
async function append(src, dest, client) {
	const rs = fs.createReadStream(src);
	return new Promise((resolve, reject) => {
		client.append(rs, dest, err => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

// 新建文件夹
async function mkdir(dir, client) {
	return new Promise((resolve, reject) => {
		client.mkdir(dir, err => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

// 递归删除路径下的所有文件
async function rmPath(dirPath, client) {
	try {
		/**
		 * 1.读取文件夹下的所有文件
		 * 2.遍历删除文件
		 * 3.遇到文件夹递归删除文件内部文件
		 */
		const files = await list(dirPath, client);
		for (let index in files) {
			const _dir = files[index];
			// linux 系统读取文件会有这两个文件名
			if ([".", ".."].includes(_dir.name)) continue;
			const _dirPath = `${dirPath}/${_dir.name}`;
			if (_dir.type === "d") {
				await rmPath(_dirPath, client);
				await rmdir(_dirPath, client);
			} else {
				await dele(_dirPath, client);
			}
		}
	} catch (error) {
		throw error;
	}
}

function checkIsFile(dir) {
	return new Promise((resolve, reject) => {
		fs.stat(dir, (err, stats) => {
			if (err) {
				reject(err);
			}
			resolve(stats.isFile());
		});
	});
}

/**
 *
 * @param {string} src  拷贝路径
 * @param {string} dest  ftp目标路径
 */
async function copyFiles(src, dest, client) {
	try {
		const srcList = await fs.readdirSync(src);
		const destList = await list(dest, client);

		for (let dir of srcList) {
			const _src = path.join(src, dir);
			const _dest = `${dest}/${dir}`;

			// 文件 直接拷贝
			if (await checkIsFile(_src)) {
				await append(_src, _dest, client);
				term("copy dest: " + _dest + "\n");
				continue;
			}

			// 判断目录是否存在
			if (
				!destList.some(m => m.type == "d" && m.name == dir)
			) {
				await mkdir(_dest, client);
				term.yellow("mkdir: " + _dest + "\n");
			}
			await copyFiles(_src, _dest, client);
		}
	} catch (error) {
		throw error;
	}
}

module.exports = {
	initClient,
	rmPath,
	copyFiles,
};
