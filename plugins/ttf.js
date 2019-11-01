const debug_on = false;
const config = require('../config.json');
var cp = require('child_process');
var spawn = cp.spawn;

var plugin = __filename.slice(__dirname.length + 1, -3);
var pluginConfig = undefined;
if (typeof (config["plugins"]) !== 'undefined') {
    pluginConfig = config["plugins"][plugin];
}

if (debug_on) {
    console.log("loading plugin:", plugin, "with config:", pluginConfig);
}

var data = {};

/**
 * ref: https://github.com/flashlizi/fontsubset
 * npm install fontsubset -g
 */
var COMMAND_NAME = 'fontsubset';

function execCmd(args, completeHandler) {
    var cmd = spawn(COMMAND_NAME, args);
    cmd.stdout.on('data', function (data) {
        if (debug_on) {
            console.log(plugin, data.toString());
        }
    });
    cmd.stderr.on('data', function (data) {
        if (debug_on) {
            console.log(plugin, data.toString());
        }
    });
    cmd.on('close', function (code) {
        if (debug_on) {
            console.log(plugin, 'close:', code);
        }
        completeHandler && completeHandler(code);
    });
}

module.exports = {
    // 表格开始解析
    workbookBegin: function (workbook, settings) {
        if (debug_on) {
            console.log(plugin, "workbookBegin:");
        }
        data = {};
    },
    // 表格解析结束
    workbookEnd: function (workbook, settings) {
        if (debug_on) {
            console.log(plugin, "workbookEnd:");
        }

        for (let font in data) {
            let sb = data[font];
            let args = [];
            args.push('-s');
            args.push(sb.join(""));

            if (pluginConfig.src.endsWith('/')) {
                args.push(pluginConfig.src + font);
            } else {
                args.push(pluginConfig.src + '/' + font);
            }

            if (pluginConfig.dest.endsWith('/')) {
                args.push(pluginConfig.dest + font);
            } else {
                args.push(pluginConfig.dest + '/' + font);
            }

            if (debug_on) {
                console.log(plugin, args);
            }
            execCmd(args, function (code) {

            });
        }
    },
    // 持久化工作表
    serializeWorkbook: function (parsedWorkbook, dest) {
        if (!debug_on) {
            return;
        }
        for (let name in parsedWorkbook) {
            console.log("serializeWorkbook:", name);
        }
    },
    // 单个sheet解析开始
    sheetBegin: function (sheet, setting) {
        if (debug_on) {
            console.log(plugin, "begin:", sheet.name);
        }
    },
    // 单个sheet解析结束
    sheetEnd: function (sheet, setting) {
        if (debug_on) {
            console.log(plugin, "end:", sheet.name);
        }
    },
    // 单个sheet解析一行
    parseRow: function (row, rowIndex, head) {
        if (debug_on) {
            console.log(plugin, "parseRow:", rowIndex);
        }

        if (typeof (pluginConfig) === 'undefined') {
            return;
        }

        let hPlugin = '!' + plugin;
        let hExtraText = '!' + pluginConfig.extra;
        let font;
        let extraText;
        // 查找插件的列索引
        for (let i = 0; i < head.length; ++i) {
            if (head[i].name === hPlugin && i < row.length && typeof (row[i]) !== 'undefined') {
                font = row[i];
            } else if (head[i].name === hExtraText && i < row.length && typeof (row[i]) !== 'undefined') {
                if (typeof (row[i]) === 'string') {
                    extraText = row[i];
                } else if (typeof (row[i]) === 'number') {
                    extraText = row[i].toString();
                } else {
                    console.log("[error]", plugin, "extra:", row[i]);
                }
            }
        }
        if (typeof (font) === 'undefined' || font.length == 0) {
            return;
        }

        let sb = data[font] ? data[font] : [];
        // 只处理类型为string的内容
        for (let i = 0; i < head.length; ++i) {
            if (head[i].type === 'string' && i < row.length && row[i].length > 0) {
                sb.push(row[i]);
            }
        }

        if (typeof (extraText) !== 'undefined' && extraText.length > 0) {
            sb.push(extraText);
        }

        data[font] = sb;
    }
};