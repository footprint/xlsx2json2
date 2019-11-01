const debug_on = false;
const fs = require('fs');
const path = require('path');

const config = require('../config.json');

var plugin = __filename.slice(__dirname.length + 1, -3);
var pluginConfig = undefined;
if (typeof (config["plugins"]) !== 'undefined') {
    pluginConfig = config["plugins"][plugin];
}

if (debug_on) {
    console.log("loading plugin:", plugin, "with config:", pluginConfig);
}

module.exports = {
    // 持久化工作表
    serializeWorkbook: function (parsedWorkbook, dest) {
        for (let name in parsedWorkbook) {
            let sheet = parsedWorkbook[name];
            // footprint: 打印 android xml多语言配置
            if (pluginConfig.sheets.includes(name)) {
                console.log("------------------------------%s--------------------------------", name);
                let strings_path = null;
                let strings_data = null;
                if (typeof (pluginConfig.path) !== 'undefined') {
                    if ('en' === name) { // en 为默认语言,无需添加语言码后缀
                        strings_path = path.resolve(path.join(pluginConfig.path, 'res', 'values', 'strings.xml'));
                    } else if ('zh-Hant' === name) { // zh-Hant 映射为安卓的语言码
                        strings_path = path.resolve(path.join(pluginConfig.path, 'res', 'values-zh-rTW', 'strings.xml'));
                    } else { // 其他按默认语言码映射
                        strings_path = path.resolve(path.join(pluginConfig.path, 'res', 'values-' + name, 'strings.xml'));
                    }
                    if (!fs.existsSync(strings_path)) {
                        console.log("error:", strings_path)
                        strings_path = null;
                    } else {
                        strings_data = fs.readFileSync(strings_path, 'utf8');
                    }
                }
                for (var key in sheet) {
                    if (typeof (sheet[key]) === 'string') {
                        if (strings_data !== null) {
                            let begin = strings_data.indexOf(`<string name=\"${key}\"`);
                            if (begin !== -1) {
                                let end = strings_data.indexOf('</string>', begin)
                                let value = sheet[key].replace(new RegExp('\'', 'g'), '\\\'');
                                strings_data = strings_data.slice(0, begin) + `<string name=\"${key}\" >${value}` + strings_data.slice(end);
                            }
                        } else {
                            console.log("<string name=\"%s\" >%s</string>", key, sheet[key].replace(new RegExp('\'', 'g'), '\\\'')); // android strings 单引号需要加转义,否则报错!
                        }
                    } else {
                        console.log(sheet[key]);
                    }
                }
                if (strings_data !== null) {
                    // fs.writeFileSync(strings_path, strings_data);
                    fs.writeFile(strings_path, strings_data, 'utf8', (err) => {
                        if (err) throw err;
                        console.log(`${strings_path} updated!`);
                    });
                }
            }
        }
    }
};