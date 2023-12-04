const path = require("path");
const fs = require("fs");
const program = require("commander");
const async = require("async");

const PKG = require("./package.json");

const FIELD_REGISTRY = "registry";

// 版本号
program.version(PKG.version);

program.command("ls").description("展示全部项目列表").action(showList);

/** ------------------------------------------------- */
/*
 * get current registry
 */
function getCurrentRegistry(cbk) {
	npm.load(function (err, conf) {
		if (err) return exit(err);
		cbk(npm.config.get(FIELD_REGISTRY));
	});
}
function showList() {
	getCurrentRegistry(function (cur) {
		console.log("cur", cur);
	});
}
