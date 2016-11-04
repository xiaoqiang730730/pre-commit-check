var exec = require('child_process').exec;
// var eslint = require('eslint');
var fs = require('fs');
var errTip = ['还存在很多错误的地方哦！，避免隐患，还是现在改了吧！/(ㄒoㄒ)/~~', '哎呀呀！还有错误哦！=_='];
var successTip = ['不错哦！加油！↖(^ω^)↗ ', '赞！~\\(≧▽≦)/~', '棒棒哒！'];
var lint = function(cb) {
    exec('eslint ./ --cache --quiet', function(error, stdout, stderr) {// 通过node子进程执行命令，
        if(stdout) {
            console.log('\x1B[31m%s',errTip[Math.floor(errTip.length*Math.random())]);
            console.log('\x1B[37m', stdout);//输出eslint错误信息
            cb(1);
            return;
        }
        cb(0);
    });
};

var extraTab = function(cb) {
    var conf = JSON.parse(fs.readFileSync('./.check', 'utf8'));
        var name = conf.dir.join(' ');
        var bTabAndSpace = conf.bTabAndSpace;
        var array;
        var text;
        var checkTab = function(text, name) {//检测函数
            if(/\t\s/.test(text)) {
                console.log('\x1B[31m%s', name);
                console.log('\x1B[37m', '存在tab键和空格键乱用哦！');
                return false;
            }
            return true;
        };
        exec('git diff HEAD --name-only --diff-filter=ACMR -- '+name+'', function(error, stdout, stderr) {// 通过node子进程执行命令
            if(stdout) {
                array = stdout.split('\n');//通过切割换行，拿到文件列表
                array.pop();// 去掉最后一个换行符号
                array.forEach(function(value) {
                    text = fs.readFileSync(value, 'utf-8');// 拿到文件内容
                    if(bTabAndSpace && !checkTab(text, value)) {//检测函数
                        cb(1);
                        return;
                    }
                });
                cb(0);
            }else {
                cb(0);
            }
        });
};

var taskList = [extraTab, lint];
// 执行检查
var task = function() {
    if(!taskList.length) {
        console.log('\x1B[32m%s', successTip[Math.floor(successTip.length*Math.random())]);
        process.exit(0);
        return;
    }
    var func = taskList.shift();
    func(function(pass) {
        if(pass === 1) {
            process.exit(1);
            return;
        }
        task();
    });
}

var startTask = function() {
    console.log('开始检查代码咯！O(∩_∩)O~\n');
    task();
}

// 执行检查
startTask();