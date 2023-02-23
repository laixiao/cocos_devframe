import { _decorator, Component, Node, AssetManager, Prefab, instantiate, director, Widget, UITransform, view, assetManager, Sprite, SpriteFrame, isValid, ImageAsset, Texture2D } from 'cc';
import { WECHAT } from 'cc/env';
import { UICF, UIConf } from './UIConf';
import { UIShowTypes, UIView, UIViewData } from './UIView';
const { ccclass, property } = _decorator;

/* 界面信息 */
export interface UIInfo {
    UIID: number;
    UIView: UIView | null;
}

export class UIManager {
    private static _instance: UIManager = null;
    public static get instance() {
        if (UIManager._instance === null) {
            UIManager._instance = new UIManager();
        }
        return UIManager._instance;
    }
    public static set instance(value) {
        UIManager._instance = value;
    }

    // UI栈(已经打开的页面)
    private _UIStack: UIInfo[] = [];
    // 缓存栈(已经关闭但是需要缓存的界面)
    private _UICache: { [UIID: number]: UIInfo } = {};
    // UI根节点
    private _uiStackNode: Node = null;
    // 打开队列
    private _openingQueue: { uiid: number, args: any, onProgress?, onComplete?}[] = [];
    // 是否正在打开
    private _isOpening: boolean = false;

    // ============================公共接口=================================
    /**
     * 打开页面 
     * @param uiid 页面ID
     * @param args 页面传递参数
     * @param onProgress 进度回调 (finished: number, total: number, item: any) => { }
     * @param onComplete 完成回调 (err, uiView: UIView) => { }
     */
    public open(uiid: number, args: any = null, onProgress?, onComplete?): void {
        this._openingQueue.push({ uiid: uiid, args: args, onProgress: onProgress, onComplete: onComplete });
        this.queueStart();
    }

    /**
     * 关闭页面
     * @param ui 页面UIView或者ID
     * @param args 传递到上一个页面的参数
     */
    public close<T>(ui?: T, args: any = null) {
        let uiid = this._getTopUI()?.UIID;
        if (ui) {
            if (typeof ui == "number") {
                uiid = ui;
            } else {
                uiid = (ui as UIView)._uiid;
            }
        }

        let info = this._getUIInfo(uiid);
        if (info && info.UIInfo) {
            this._recycle(info.UIInfo);

            this._UIStack.splice(info.i, 1);

            // 关闭页面回调
            info.UIInfo.UIView.onClose();

            // 显示顶部页面
            if (info.UIInfo.UIView.type == UIShowTypes.Single) {
                this._showTopUI();
            }

            // 上一个页面关闭回调
            let topUI = this._getTopUI();
            topUI?.UIView.onCloseLastUi({ fromUI: uiid, args: args });
        } else {
            console.log("页面不存在")
        }
    }

    /**
     * 关闭到指定页面
     * @param uiid 页面ID
     * @param args 传递参数
     */
    public closeToUi(uiid: number, args: any = null) {
        let topUiOld = this._getTopUI();
        let fromUI = 0;
        if (topUiOld) {
            fromUI = topUiOld.UIID;
        }

        let info = this._getUIInfo(uiid);
        if (info && info.UIInfo) {
            // console.log(info.i + 1, this._UIStack.length - info.i)
            let deleteUIs = this._UIStack.splice(info.i + 1, this._UIStack.length - info.i);
            for (let i = 0; i < deleteUIs.length; i++) {
                this._recycle(deleteUIs[i]);
            }

            // 关闭页面回调
            topUiOld?.UIView.onClose();

            // 显示顶部页面
            if (info.UIInfo.UIView.type == UIShowTypes.Single) {
                this._showTopUI();
            }

            // 上一个页面关闭回调
            let topUINew = this._getTopUI();
            topUINew?.UIView.onCloseLastUi({ fromUI: fromUI, args: args });

        }
    }

    /**
     * 替换栈顶界面
     * @param uiid 界面uiid
     * @param args 传递参数
     */
    public replace(uiid: number, args: any = null, onProgress?, onComplete?) {
        let topUI = this._getTopUI();

        let info = this._getUIInfo(topUI.UIID);
        if (info && info.UIInfo) {
            this._recycle(info.UIInfo);

            this._UIStack.splice(info.i, 1);
            // 关闭页面回调
            info.UIInfo.UIView.onClose();
        }

        this.open(uiid, args, onProgress, onComplete)
    }

    /**
     * 页面是否已经显示
     * @param uiid 页面id
     * @returns 页面UIView组件
     */
    public getUI(uiid: number): UIView | null {
        for (let index = 0; index < this._UIStack.length; index++) {
            if (this._UIStack[index].UIID == uiid) {
                return this._UIStack[index].UIView;
            }
        }
        return null;
    }

    /**
     * 批量关闭页面
     * @param obj include包含 exclude排除
     * @param isClear 是否释放缓存
     */
    public closeUIs(obj: { include?: number[], exclude?: number[] }, isClear: boolean = true) {
        let uiStack = [];

        // 包含的
        if (obj.include) {
            for (let i = 0; i < obj.include.length; i++) {
                uiStack.push({ UIID: obj.include[i] })
            }
        }

        // 排除的
        if (obj.exclude) {
            uiStack = this._UIStack.filter((ele) => {
                if (obj.exclude.indexOf(ele.UIID) < 0) {
                    return true;
                } else {
                    return false;
                }
            })

        }

        for (let i = 0; i < uiStack.length; i++) {
            let info = this._getUIInfo(uiStack[i].UIID);
            if (info) {
                // 是否释放缓存
                if (isClear) {
                    info.UIInfo.UIView.cache = false;
                }

                this._recycle(info.UIInfo);

                this._UIStack.splice(info.i, 1);
            }
        }
    }


    /**
     * 设置精灵图
     *  UIManager.instance.setSpriteFrame(this, Imgs.head, this.icon)
     *  UIManager.instance.setSpriteFrame(this, "https://oss.99huyu.cn/adsense/production/chengyu/大开眼界.png", this.icon)
     * 
     * @param ui 页面UIView或者ID
     * @param path 路径
     * @param sprite 精灵
     * @returns Promise<SpriteFrame>
     */
    public setSpriteFrame<T>(ui: T, path: string, sprite?: Sprite): Promise<SpriteFrame> {
        let uiView: UIView = this._getTopUI()?.UIView;
        if (ui) {
            if (typeof ui == "number") {
                uiView = this.getUI(ui);
            } else {
                uiView = (ui as UIView);
            }
        }

        return new Promise((resolve, reject) => {
            if (path.indexOf("http://") >= 0 || path.indexOf("https://") >= 0) {
                // 网络图 远程 url 带图片后缀名
                assetManager.loadRemote<ImageAsset>(path, function (err, imageAsset: ImageAsset) {
                    if (err) {
                        console.error(err);
                        reject(null);
                    } else {
                        const spriteFrame = new SpriteFrame();
                        const texture = new Texture2D();
                        texture.image = imageAsset;
                        spriteFrame.texture = texture;

                        // 设置精灵
                        if (sprite && sprite.node && sprite.node.isValid) {
                            sprite.spriteFrame = spriteFrame;
                        }
                        
                        // (增加引用计数) 不确定是否生效
                        if (isValid(imageAsset)) {
                            imageAsset.addRef();
                            uiView._cacheAsset.push(imageAsset);
                        }

                        resolve(spriteFrame);
                    }
                });
            } else {
                // 本地图
                this._getBundle(path.split("/")[0]).then((bundle: AssetManager.Bundle) => {
                    bundle.load(path.slice(path.indexOf("/") + 1, path.length), SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                        if (err) {
                            console.error(err);
                            reject(null);
                        } else {
                            // 设置精灵
                            if (sprite && sprite.node && sprite.node.isValid) {
                                sprite.spriteFrame = spriteFrame;
                            }

                            // 增加引用计数
                            if (isValid(spriteFrame)) {
                                spriteFrame.addRef();
                                uiView._cacheAsset.push(spriteFrame);
                            }

                            resolve(spriteFrame);
                        }
                    })
                })
            }

        })
    }














    // =====================私有方法=========================

    // 开始打开页面队列
    private queueStart() {
        if (this._openingQueue.length > 0) {
            if (!this._isOpening) {
                this._isOpening = true;
                let item = this._openingQueue.shift()
                this._openTemp(item.uiid, item.args, item.onProgress, item.onComplete);
            }
        }
    }
    // 继续打开页面队列
    private _queueContinue() {
        this._isOpening = false;
        this.queueStart();
    }
    // 打开一个页面
    private _openTemp(uiid: number, args: any = null, onProgress?, onComplete?): void {
        let uiConf = UICF[uiid];
        // 获取UI根节点
        if (!this._uiStackNode) {
            let canvas = director.getScene().getChildByName('Canvas');
            if (!canvas) {
                console.error("canvas节点不存在")
                return;
            }
            if (!canvas.getChildByName('UIStack')) {
                let uiStackNode = new Node("UIStack");
                let uiCom = uiStackNode.addComponent(UITransform);
                uiCom.setContentSize(view.getVisibleSize());
                canvas.addChild(uiStackNode);
            }
            this._uiStackNode = canvas.getChildByName('UIStack');
        }

        // 检查UI栈
        let uiStackItem = this._getUIInfo(uiid);
        if (uiStackItem) {
            // 同优先级置顶排序
            if (uiStackItem.i + 1 < this._UIStack.length) {
                let tempItem = null;
                for (let i = uiStackItem.i + 1; i < this._UIStack.length; i++) {
                    if (this._UIStack[i].UIView._uiPriority == uiStackItem.UIInfo.UIView._uiPriority) {
                        tempItem = this._UIStack[i];
                        this._UIStack[i - 1] = tempItem;
                        this._UIStack[i] = uiStackItem.UIInfo;
                    }
                }
            }

            for (let i = 0; i < this._UIStack.length; i++) {
                if (uiStackItem.UIInfo.UIView.type == UIShowTypes.Single) {
                    // 单页面
                    if (this._UIStack[i].UIID == uiid) {
                        this._UIStack[i].UIView.node.active = true;
                    } else {
                        this._UIStack[i].UIView.node.active = false;
                    }
                } else {
                    // 叠加
                    if (this._UIStack[i].UIID == uiid) {
                        this._UIStack[i].UIView.node.active = true;
                        return;
                    }
                }
            }

            this._queueContinue();
            return;
        }

        // 检查缓存栈
        if (this._UICache[uiid]) {
            this._insertUIStack(this._UICache[uiid], args);

        } else {
            let uiInfo: UIInfo = { UIID: uiid, UIView: null };

            if (UICF[uiid].loading) {
                if (WECHAT) {
                    window["wx"].showLoading({ title: "加载中...", mask: true })
                }
            }
            this._getBundle(uiConf.bundle).then((bundle: AssetManager.Bundle) => {
                bundle.load(uiConf.path, Prefab, onProgress, (err, prefab: Prefab) => {
                    if (err) {
                        console.error("页面路径错误" + uiConf.path)
                    } else {
                        // 组件
                        let node = instantiate(prefab);
                        uiInfo.UIView = node.getComponent(UIView);

                        // 页面ID
                        uiInfo.UIView._uiid = uiid;
                        // 优先级
                        uiInfo.UIView._uiPriority = uiConf.priority;
                        // 预制体
                        uiInfo.UIView._prefab = prefab;
                        // 增加引用
                        prefab.addRef();

                        this._insertUIStack(uiInfo, args);
                    }

                    if (UICF[uiid].loading) {
                        if (WECHAT) {
                            window["wx"].hideLoading()
                        }
                    }

                    onComplete && onComplete(err, uiInfo.UIView);
                })
            })
        }
    }


    // 获取页面信息
    private _getUIInfo(UIID: number): { i: number, UIInfo: UIInfo } | null {
        for (let i = 0; i < this._UIStack.length; i++) {
            if (UIID == this._UIStack[i].UIID) {
                return { i: i, UIInfo: this._UIStack[i] };
            }
        }
        return null;
    }

    // 插入排序（根据优先级排序）
    private _insertUIStack(uiInfo: UIInfo, args: any) {
        uiInfo.UIView.node.parent = this._uiStackNode;
        let topUI = this._getTopUI();
        let fromUI = 0;
        if (topUI) {
            fromUI = topUI.UIID;
        }

        let pushed = false;
        for (let i = this._UIStack.length - 1; i >= 0; i--) {
            if (this._UIStack[i].UIView._uiPriority > uiInfo.UIView._uiPriority) {
                this._UIStack[i].UIView.node.setSiblingIndex(i + 1);
            } else {
                this._UIStack.splice(i + 1, 0, uiInfo)
                uiInfo.UIView.node.setSiblingIndex(i + 1);
                pushed = true;
                break;
            }
        }
        if (!pushed) {
            this._UIStack.unshift(uiInfo)
            uiInfo.UIView.node.setSiblingIndex(0);
        }

        // 隐藏其他页面
        if (uiInfo.UIView.type == UIShowTypes.Single) {
            for (let i = this._UIStack.length - 1; i >= 0; i--) {
                if (this._UIStack[i].UIView.type == UIShowTypes.Single && uiInfo.UIID != this._UIStack[i].UIID) {
                    this._UIStack[i].UIView.node.active = false;
                }
            }
        }

        // 打开页面事件
        uiInfo.UIView.onOpen({ fromUI: fromUI, args: args });

        this._queueContinue();
    }

    // 显示顶部的UI（单页面模式）
    private _showTopUI() {
        let topIndex = null;
        for (let i = this._UIStack.length - 1; i >= 0; i--) {
            if (this._UIStack[i].UIView.type == UIShowTypes.Single) {
                if (topIndex) {
                    this._UIStack[i].UIView.node.active = false;
                } else {
                    topIndex = i;
                    this._UIStack[i].UIView.node.active = true;
                }
            }
        }
    }

    private _getTopUI(): UIInfo | null {
        for (let i = this._UIStack.length - 1; i >= 0; i--) {
            if (this._UIStack[i].UIView.node.active) {
                return this._UIStack[i];
            }
        }
        return null;
    }

    private _getBundle(name): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            if (assetManager.getBundle(name)) {
                resolve(assetManager.getBundle(name));
            } else {
                assetManager.loadBundle(name, (err) => {
                    if (err) {
                        console.error(err)
                    }
                    resolve(assetManager.getBundle(name));
                })
            }
        })
    }

    private _recycle(uiInfo: UIInfo) {
        if (uiInfo.UIView.cache) {
            // 缓存：放回_UICache
            uiInfo.UIView.node.removeFromParent();
            this._UICache[uiInfo.UIID] = uiInfo;
        } else {
            // 不缓存：释放资源
            uiInfo.UIView._prefab.decRef();
            uiInfo.UIView._prefab = null;
            delete this._UICache[uiInfo.UIID];

            uiInfo.UIView.node.destroy();
        }
    }

}


