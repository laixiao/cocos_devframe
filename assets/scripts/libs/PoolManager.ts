import { NodePool, Prefab, Node, instantiate, assetManager, AssetManager, isValid } from "cc";

/*
 *   @class PoolManager
 *   @author lx
 * 
 *   TODO  对象池管理器
 */

export interface TaskItem {
    order?: number,//排队序号
    name?: string,//描述
    task: Function,//任务
    complete: Function//完成回调
}

export default class PoolManager {
    private static _instance: PoolManager = null;
    public static get instance(): PoolManager {
        if (PoolManager._instance === null) {
            PoolManager._instance = new PoolManager();
        }
        return PoolManager._instance;
    }
    public static set instance(value: PoolManager) {
        PoolManager._instance = value;
    }

    /**
     * 大池
     */
    public pools: any = {};
    public limitObj: any = {};               //数量上限-小池
    private _defaultLimit: number = 999;
    private pools_prefab: any = {};      //预制体
    private loadArry: string[] = [];               //未加载的预制体队列
    private isLoading = false;           //是否正在加载

    private getBundle(name: string): any {
        return new Promise((resolve, reject) => {
            if (assetManager.getBundle(name)) {
                resolve(assetManager.getBundle(name));
            } else {
                assetManager.loadBundle(name, (err) => {
                    resolve(assetManager.getBundle(name));
                })
            }
        })
    }

    // 检查对象池是否实例化
    private checkPool(path: string) {
        if (!this.pools[path]) {
            this.pools[path] = new NodePool("CCEntity");
        }
    }
    // 初始化一个对象池
    private initOnePool(path: string, limitCount: number, callback: Function) {
        this.checkPool(path);

        // 未设置上限，就设置一下
        if (this.limitObj[path] && this.limitObj[path].limitCount) {
            if (limitCount != this._defaultLimit) {
                this.limitObj[path].limitCount = limitCount;
            }
        } else {
            this.setLimit(path, limitCount);
        }

        if (!this.pools_prefab[path]) {
            this.getBundle(path.split("/")[0]).then((bundle: AssetManager.Bundle) => {
                bundle.load(path.slice(path.indexOf("/") + 1, path.length), Prefab, (err: Error, prefab: Prefab) => {
                    if (err) {
                        console.error(path + '资源加载错误>>>>>', err)
                    } else {
                        this.pools_prefab[path] = prefab;

                        if (isValid(this.pools_prefab[path])) {
                            (this.pools_prefab[path] as Prefab).addRef();
                        }
                    }
                    callback();
                });
            })
        } else {
            callback();
        }
    }
    // 自动异步加载
    private autoInitPool() {
        if (this.loadArry.length > 0 && !this.isLoading) {
            this.isLoading = true;
            let path = this.loadArry.shift();
            this._initPool([path], () => {
                this.isLoading = false;
                this.autoInitPool();
            })
        }
    }
    /* 判断某一预制体资源是否加载 */
    private isLoaded(path: string) {
        if (this.pools_prefab[path]) {
            return true;
        } else {
            return false;
        }
    }
    /**
     * 从某一对象池获取对象
     * @param {*} path 对象池
     * @param {*} return  返回一个node
     * 示例：
     *  let item = PoolManager.single.getItem("xxx/xxx");
     */
    private getItem(path: string) {
        //1.检测有没有该资源对象池
        this.checkPool(path);
        //2.生成该资源并返回
        let node = null;
        if (this.pools[path].size() > 0) {
            node = this.pools[path].get();
        } else {
            if (this.pools_prefab[path]) {
                if (this.limitObj[path].spawnCount <= this.limitObj[path].limitCount) {
                    node = instantiate(this.pools_prefab[path]);
                    this.limitObj[path].spawnCount++;
                } else {
                    // console.warn("内存警告：" + path + " 数量已达上限" + this.limitObj[path].limitCount)
                }
            } else {
                // console.warn("未初始化对象池：" + path)
                if (this.loadArry.indexOf(path) < 0) {
                    this.loadArry.push(path);
                    this.autoInitPool();
                }
            }
        }

        // if (!node) {
        //     console.warn("对象池资源加载失败:")
        //     this.logPool(path)
        // }

        return node;
    }
    private _initPool(pathArray: Array<string>, completeCallback?: Function, progressCallback?: Function) {
        if (pathArray.length > 0) {
            let path = pathArray.shift();
            // console.log(path)
            this.initOnePool(path, this._defaultLimit, () => {
                // 加载完一个
                if (progressCallback) {
                    progressCallback()
                }
                // 继续加载下一个
                this._initPool(pathArray, completeCallback, progressCallback);
            })
        } else {
            if (completeCallback) {
                completeCallback()
            }
        }
    }
    /**
     * 设置某一对象池的数量上限
     * @param {*} path 对象池
     * @param {*} limitCount 上限
     */
    private setLimit(path: string, limitCount: number) {
        if (!this.limitObj[path]) {
            this.limitObj[path] = {
                spawnCount: 0,//当前已生成的数量
                limitCount: limitCount//数量限制-上限
            }
        } else {
            this.limitObj[path].limitCount = limitCount;
        }
    }
    private isEmptyStr(s: string) {
        if (typeof s == 'string' && s.length > 0) {
            return false
        }
        return true
    }



    // =====================公共接口============================
    /**
     * 初始化对象池（初始化后才能使用哦）
     * @param {*} pathArray 要初始化的对象池数组
     * @param {*} callback 完成回调
     * 
     * 示例：
     *     PoolManager.instance.initPool([ "effect/main/OnceCoin", "effect/main/IncomeCoin" ]);
     *   
     */

    // /* 对象池内容初始化一些进去 */
    // public initSize(path: string, size: number) {
    //     if (this.pools[path]) {
    //         if (this.pools[path].size() < size) {
    //             let delNum = size - this.pools[path].size();

    //             let nodeArry = [];
    //             for (let i = 0; i < delNum; i++) {
    //                 nodeArry.push(this.getItem(path));
    //             }
    //             for (let i = 0; i < nodeArry.length; i++) {
    //                 this.pools[path].put(nodeArry[i]);
    //             }
    //             console.log(path + "对象池大小", this.pools[path].size())
    //         } else {
    //             return this.pools[path].size();
    //         }
    //     } else {
    //         return 0;
    //     }
    // }

    public initPools(list: Array<{ path: string, limit: number }>, completeCallback?: Function) {
        if (list.length > 0) {
            let item = list.shift();

            this.initOnePool(item.path, item.limit, () => {
                // 继续加载下一个
                this.initPools(list, completeCallback);
            })
        } else {
            completeCallback && completeCallback();
        }
    }

    /* 获取某一对象池的大小 */
    public getPoolSize(path: string) {
        if (this.pools[path]) {
            return this.pools[path].size();
        } else {
            return 0;
        }
    }

    /* 
     * 从某一对象池获取对象
     * @param {*} path 对象池
     * @param {*} callback  回调一个node
     */
    public getItemSync(path: string): Promise<Node> {
        if (this.isEmptyStr(path)) {
            console.error("资源路径为空：" + path)
            return null;
        } else {
            return new Promise<Node>((resolve, reject) => {
                this._addTask({
                    order: this._taskQueue.length,
                    name: path,
                    task: () => {
                        return new Promise<Node>((resolve2, reject2) => {
                            this._initPool([path], () => {
                                resolve2(this.getItem(path));
                            });
                        });
                    },
                    complete: (node: Node) => {
                        resolve(node);
                    }
                });
            });
        }
    }

    /**
     * 专用任务队列
     * @param task 任务：返回Promise
     * @param complete 完成回调一个node
     */
    private _addTask(taskItem: TaskItem) {
        this._taskQueue.push(taskItem);
        this._startTask();
    }
    private _taskQueue: TaskItem[] = [];
    private _executing: boolean = false;
    private _startTask() {
        if (!this._executing && this._taskQueue.length > 0) {
            this._executing = true;
            let taskItem = this._taskQueue.shift();
            taskItem.task().then((node: Node) => {
                taskItem.complete(node);
                this._executing = false;
                // console.log(taskItem.order, "任务执行完成",  taskItem.name)
                this._startTask();
            });
        }
    }

    /**
     * 把对象放回某一对象池
     * @param {*} path 资源路径
     * @param {*} node 对象
     * @param {*} isRelease 是否释放
     */
    public putItem(path: string, node: Node, isRelease: boolean = false) {
        if (path && node && node.isValid && this.pools_prefab[path]) {
            // 从老爸移除，避免关联释放
            if (node.parent) {
                node.removeFromParent();
            }
            node.parent = null;

            // 回收
            this.pools[path].put(node);

            // 释放资源：一旦引用计数为零，Creator 会对资源进行自动释放    
            if (isRelease &&  (this.pools[path] as NodePool).size()) {
                // 清除对象池
                (this.pools[path] as NodePool).clear();
                // 释放引用
                if (isValid(this.pools_prefab[path])) {
                    (this.pools_prefab[path] as Prefab).decRef();
                }

                delete this.pools[path];
                delete this.pools_prefab[path];
            }
        }
        // console.log(path+"对象池大小：", this.pools[path].size())
    }

    // 清空对象池
    public clearAll() {
        for (const key in this.pools) {
            if (Object.prototype.hasOwnProperty.call(this.pools, key)) {
                this.limitObj[key].spawnCount = 0;

                // 清除对象池
                this.pools[key].clear();
                // 释放引用
                if (isValid(this.pools_prefab[key])) {
                    (this.pools_prefab[key] as Prefab).decRef()
                }

                delete this.pools[key];
                delete this.pools_prefab[key];
            }
        }
    }

    /* 输出对象池信息 */
    public logPool(path?: string) {
        console.log("===================")
        console.log("当前对象池数据：")

        let strArry: { spawnCount: number, msg: string }[] = [];
        for (const key in this.pools) {
            if (Object.prototype.hasOwnProperty.call(this.pools, key)) {
                const item = this.pools[key];
                if (path) {
                    if (path == key) {
                        strArry.push({ spawnCount: this.limitObj[key].spawnCount, msg: "总生成：" + this.limitObj[key].spawnCount + "，池剩余" + item.size() + "，场上：" + (this.limitObj[key].spawnCount - item.size()) + ", 上限：" + (this.limitObj[key].limitCount == this._defaultLimit ? '∞' : this.limitObj[key].limitCount) + " 路径：" + key })
                        break;
                    }
                } else {
                    strArry.push({ spawnCount: this.limitObj[key].spawnCount, msg: "总生成：" + this.limitObj[key].spawnCount + "，池剩余" + item.size() + "，场上：" + (this.limitObj[key].spawnCount - item.size()) + ", 上限：" + (this.limitObj[key].limitCount == this._defaultLimit ? '∞' : this.limitObj[key].limitCount) + " 路径：" + key })
                }
            }
        }

        strArry = strArry.sort((a, b) => {
            return b.spawnCount - a.spawnCount;
        })

        for (let i = 0; i < strArry.length; i++) {
            console.log(strArry[i].msg)
        }

        console.log("===================")
    }

}