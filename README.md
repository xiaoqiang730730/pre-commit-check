# pre-commit-check
use pre-commit npm to check code

# pre-commit

顾名思义’pre-commit‘，就是在代码提交之前做些东西，比如代码打包，代码检测，称之为钩子（hook）。可以理解为回调好了，在commit之前执行一个函数（callback）。这个函数成功执行完之后，再继续commit，但是失败之后就阻止commit了。

![](http://7te8kr.com1.z0.glb.clouddn.com/pre_1.png)

在.git->hooks->下面有个pre-commit.sample*，这个里面就是默认的函数(脚本)样本。

# npm script

之前在掘金里面看到一篇[Run npm scripts in a git pre-commit Hook](http://elijahmanor.com/npm-precommit-scripts/), 可以利用npm script来做脚本。

## 安装pre-commit
```
npm install pre-commit --save-dev
```

## 修改package.json
```
"scripts": {
    "lint": "node check.js" // 检查的脚本
  },
  "pre-commit": [
    "lint" // 与scripts中的脚本名称一一对应
  ],
```

## 问题
按照之前的那篇文章，接下来更改某个文件，应该是可以执行check脚本了，但是在window下并没有pre-commit。

在[github上找到了原因](https://github.com/observing/pre-commit/issues/72), 因为在window下pre-commit npm，由于权限问题，导致无法在hooks文件下生成文件。

需要以管理员打开cmd，执行`node ./node_modules/pre-commit/install.js`就可以了。

# 检测脚本check

## 隐患检测
使用eslint检测潜在的错误，由于eslint比较严格，一下子会有很多的error，可以在项目里面新建`.eslintrc`文件, 用来覆盖默认的严格的eslint rules。

由于引用是第3方的库，比如框架、组件、ui库等等。这些应该不需要检测的，不要影响项目本身的代码。这里就需要在项目里新建个`.eslintignore`文件，用来忽略检测的文件夹。

这个时候执行`eslint ./ --cache`,会有很多warnings，参考[ESLint配置](http://eslint.org/docs/user-guide/command-line-interface#handling-warnings)，执行`eslint ./ --cache --quiet`,就可以只报出error的信息了。到项目后期，可以慢慢将eslint越来越严格，甚至warn也不允许。

```javascript
var exec = require('child_process').exec;
var fs = require('fs');
var errTip = ['还存在很多错误的地方哦！，避免隐患，还是现在改了吧！', '哎呀呀！还有错误哦！'];
var successTip = ['不错哦！加油！', '赞！', '棒棒哒！'];
var lint = function(cb) {
    exec('eslint ./ --cache --quiet', function(error, stdout, stderr) {// 通过node子进程执行命令
        if(stdout) {
            console.log('\x1B[31m%s',errTip[Math.floor(errTip.length*Math.random())]);
            console.log('\x1B[37m', stdout);//输出eslint错误信息
            cb(1);
            return;
        }
        cb(0);
    });
}

var taskList = [lint];
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
```

## 规范检测
除了一些隐患要检测，还可能要检测一些代码规范，tab键和空格键乱用等等，这个适合各个团队不同的情况。

一下子全部去改造有点不现实。试想能不能只对修改的文件进行检查？其实是可以的。

通过`git diff HEAD --name-only --diff-filter=ACMR`命令能够拿到修改过的代码的文件列表，同时我们新增了一个第三方的库，也可以再添加参数，过滤不需要的文件夹。

核心代码
```
//name为检测的文件夹，如‘modules component static’
exec('git diff HEAD --name-only --diff-filter=ACMR -- '+name+'', function(error, stdout, stderr) {// 通过node子进程执行命令，
    if(stdout) {
        array = stdout.split('\n');//通过切割换行，拿到文件列表
        array.pop();// 去掉最后一个换行符号
        array.forEach(function(value) {
            text = fs.readFileSync(value, 'utf-8');// 拿到文件内容
            if(检测函数) {
                cb(1);
                return;
            }
        });
        cb(0);
    }else {
        cb(0);
    }
});
```
## 实例检测函数
由于每个人的代码编辑器不一样！最简单的分格就是tab键和空格键混用。就写个很简单的检测tab键和空格的函数。
```
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
```
将extraTab加入taskList任务队列里面就可以了！