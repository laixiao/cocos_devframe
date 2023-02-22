# cocos_devframe
cocos开发框架


## 框架说明

### 按需导入

### 1.UI管理器：UIManager.ts、UIConf.ts、UIConf.ts
    1.配置页面：UIConf.ts
    2.打开页面：UIManager.instance.open(UIID.AAA, { nick: "xxx" })
    3.设置图片：UIManager.instance.setSpriteFrame(this, Imgs.head, this.icon).then((spriteFrame: SpriteFrame)=>{ });
    3.常用接口：打开、获取、关闭


### 2.事件管理器：EventManager.ts 
    1.监听事件：EventManager.instance.on(EventName.GameStart, this.GameStartFun, this);
    2.取消监听：EventManager.instance.off(EventName.GameStart, this.GameStartFun, this);
    3.常用接口：监听、触发、移除

### 3.音频管理器：AudioManager.ts
    1.播放：AudioManager.instance.playSound(SoundName.BGM);
    2.停止：AudioManager.instance.stopSound(SoundName.BGM);
    3.常用接口：播放、获取音频时长、停止

### 4.对象池管理器：PoolManager.ts
    1.生成节点：PoolManager.instance.getItemSync(PrefabName.Enemy).then((node:Node) => { if (node) { // todo } })
    2.回收节点：PoolManager.instance.putItem(PrefabName.Enemy, node);
    3.初始化对象池： PoolManager.instance.initPools([ { path: PrefabName.Enemy, limit: 200 } ]);
    4.常用接口：生成节点、回收节点、初始化对象池、获取对象池大小



### 工具类：Util.ts
    1.获取Bundle分包：Util.instance.getBundle(uiConf.bundle).then((bundle: AssetManager.Bundle)=>{ })
    2.生成系统唯一值：Util.instance.spawnUniqueNum();
    3.常用接口：获取随机整数、金币换算、字符串判空等



## 推荐插件库

推荐插件：
https://github.com/potato47/ccc-devtools

推荐ECS框架：
https://github.com/shangdibaozi/ECS