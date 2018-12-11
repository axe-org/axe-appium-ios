## axe-appium-ios

在 `Axe`系统中，使用 `appium`做自动化测试。`appium`为黑盒UI测试， 我们的自动化测试，基于`Appium`, 添加性能测试功能， 并制作测试报告。

### 基础功能

1. 记录测试中关键节点的截图。
2. 记录测试中， 业务组件之间的交互信息，即`Axe`框架中的 `Route` 、 `Data` 和 `Event`交互。
3. 对于测试中的崩溃，导出并记录崩溃日志。

### 性能测试

1. 在测试过程中，使用 `Instruments` 监控应用的性能情况。
2. `AXE` : 在`Xcode10`上，支持自定义`Instrument` ，所以我们自定义了一个 `AXE`的测试类型，来获取基础的信息：CPU使用率、内存情况、磁盘读写、FPS和GPU使用率、网络读写情况。 （不支持低版本的机型）
3. `Time Profiler` : 获取函数耗时情况， 展示数据分为两份，一份是使用[SpeedScope](https://github.com/jlfwong/speedscope)展示的火焰图，一份是主线程高耗时函数分析：通过分析耗时，发现在主线程中执行超过17毫秒的函数。
4. `Leaks` : 一开始设想在自动化测试时，通过`Leaks`来自动检测内存泄漏情况。 但是现在使用上存在问题：
		
	1. `Instruments`只支持自身调起设备上用的情况下去检测，而不支持运行时`attach`到该应用上， 而目前`appium`只支持 `attach`到已运行应用的模式。（旧系统设备可以连接，如我测试使用的iOS10的设备。）
	2. `Leaks`的测试数据太大，5、6分钟的检测数据，可能就达到了2G以上的大小，而 `appium`现在对大的测试文件的传输的处理并不好，导致无法准确地获取性能测试的结果。

	基于以上两个原因，`Leaks`测试暂时还是无法稳定运行，之后我们会继续研究解决`Leaks`测试的稳定性。

### 配置说明

目前测试用例的编写和使用情况，参考 [Test模块](). 在 `test`文件夹下，设置一个 `setting.json`的配置文件，以进行配置。

目前将测试分为三种类型：

* debug: 通常用来本地测试的情况，默认选中第一台真机来测试。
* release: 提交代码，进行打包发布版本时使用的测试，一般要多设置几台指定机型以保证一定的兼容性。
* profile: 性能测试一般覆盖需要进行的性能测试种类即可，即一种性能测试只测一次。

配置介绍：

* `debugTestDevices` : Array类型，指定测试列表。如果没有指定，则默认使用第一个真机。列表中的值为设备的udid,如 `["e876a55aec299761251f30d808fdd94bf66e26cf"]`.
* `releaseTestDevices` : Array类型，指定测试列表。 如果没有指定，则默认使用所有真机。。。
* `profileTestSetting` : Object类型， 对于性能测试，我们将其按照具体的类型来设置，如 ：

			"profileTestSetting": {
				"AXE": ["e876a55aec299761251f30d808fdd94bf66e26cf"],
				"Time Profiler": ["e876a55aec299761251f30d808fdd94bf66e26cf"]
			},

* `testServer` : 测试服务器的地址，测试服务器默认由`axe-appium-ios`调起，与`appium`客户端位于同一台机器中，使用端口2670. 但是测试设备也要访问测试服务器，所以设备与测试服务器要在同一个网络环境下，而这里写的服务器地址，是给测试设备访问测试服务器使用的。 如 ：`"testServer":"http://192.168.1.3:2670"`
* `testOutputDir` : 测试数据和报告输出文件夹，应固定为 `../build/autotest` . 测试用例放在项目的`test`目录下，而测试输出在项目的`build`目录下。

### 当前情况

目前 Axe的自动化测试功能已初步成型， 以下有两份测试报告可供了解：

* [性能测试报告](http://resource.luoxianming.cn/axe/final/index.html)  （[打包下载](http://resource.luoxianming.cn/axe/final.zip)）
* 普通测试报告

## 使用细节

### 安装依赖

* appium
* ios-deploy
* ifuse 安装:

		brew uninstall ideviceinstaller
		brew uninstall libimobiledevice
		brew uninstall --ignore-dependencies usbmuxd
		brew install --HEAD usbmuxd
		brew install --HEAD libimobiledevice
		brew link --overwrite libimobiledevice
		brew install ideviceinstaller
		brew link --overwrite ideviceinstaller
		brew cask install osxfuse
		brew install ifuse 


### 测试约束

* 每个小的测试项，完成时必须恢复到最初的页面。
* 只支持一次启动的测试， 暂时不支持多次启动的测试。
* 测试分两块， UI测试， 和功能的mock测试。 当前我们只关注于业务组件的UI测试。

### 接口说明

*  getDriver(） : 获取一个appium的`PromiseChainWebdriver`
*  close() :  关闭一个driver, 用于在一次测试中，测试多次启动的情况。目前暂未很好支持这种需求。
*  mark(title) : 截图并记录信息。
*  action ： 在脚本中，获取到最近的业务组件的交互信息，目前不推荐使用。
*  createScenario() 和 endScenario(): 测试用例的开始和结束的信息上报。 
