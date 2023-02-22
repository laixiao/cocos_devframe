import { _decorator, Component, Node, AssetManager, Prefab, instantiate, director, Widget, UITransform, view, assetManager, Sprite, SpriteFrame, isValid } from 'cc';
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


    // ============================公共接口=================================
    /**
     * 打开页面 
     * @param uiid 页面ID
     * @param args 页面传递参数
     */
    public open(uiid: number, args: any = null): void {
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
                    if (this._UIStack[i].UIView._priority == uiStackItem.UIInfo.UIView._priority) {
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
            return;
        }

        // 检查缓存栈
        if (this._UICache[uiid]) {
            this._insertUIStack(this._UICache[uiid], args);

        } else {
            let uiInfo: UIInfo = { UIID: uiid, UIView: null };

            this._getBundle(uiConf.bundle).then((bundle: AssetManager.Bundle) => {
                bundle.load(uiConf.path, Prefab, (err, prefab: Prefab) => {
                    if (err) {
                        console.error("页面路径错误" + uiConf.path)
                    } else {
                        // 组件
                        let node = instantiate(prefab);
                        uiInfo.UIView = node.getComponent(UIView);

                        // 页面ID
                        uiInfo.UIView._uiid = uiid;
                        // 预制体
                        uiInfo.UIView._prefab = prefab;
                        // 优先级
                        uiInfo.UIView._priority = uiConf.priority;

                        this._insertUIStack(uiInfo, args);
                    }

                })
            })
        }

    }

    /**
     * 关闭页面
     * @param ui 页面UIView或者ID
     * @param args 传递到上一个页面的参数
     */
    public close<T>(ui?: T, args: any = null) {
        let uiid = this._UIStack[this._UIStack.length - 1].UIID;//如果不传：默认关闭顶部
        if (ui) {
            if (typeof ui == "number") {
                uiid = ui;
            } else {
                uiid = (ui as UIView)._uiid;
            }
        }

        let info = this._getUIInfo(uiid);
        if (info && info.UIInfo) {
            if (info.UIInfo.UIView.cache) {
                // 缓存：放回_UICache
                info.UIInfo.UIView.node.removeFromParent();
                this._UICache[uiid] = info.UIInfo;
            } else {
                // 不缓存：释放资源
                info.UIInfo.UIView._prefab.decRef();
                info.UIInfo.UIView._prefab = null;
                delete this._UICache[uiid];

                info.UIInfo.UIView.node.destroy();
            }

            this._UIStack.splice(info.i, 1);

            // 显示顶部页面
            if (info.UIInfo.UIView.type == UIShowTypes.Single) {
                this._showTopUI();
            }

            // 关闭页面回调
            info.UIInfo.UIView.onClose();
            // 上一个页面关闭回调
            let topUI = this._getTopUI();
            topUI?.UIView.onCloseLastUi({ fromUI: uiid, args: args });
        } else {
            console.log("页面不存在")
        }
    }
    /**
     * 页面是否已经显示
     * @param ui 页面id
     * @returns 页面UIView组件
     */
    public getUI(ui: number): UIView | null {
        for (let index = 0; index < this._UIStack.length; index++) {
            if (this._UIStack[index].UIID == ui) {
                return this._UIStack[index].UIView;
            }
        }
        return null;
    }

    /**
     * 设置精灵图
     * 
     * @param ui 页面UIView或者ID
     * @param path 路径
     * @param sprite 精力
     * @returns Promise<SpriteFrame>
     */
    public setSpriteFrame<T>(ui: T, path: string, sprite?: Sprite): Promise<SpriteFrame> {
        let uiView: UIView = this._UIStack[this._UIStack.length - 1].UIView;//如果不传：默认使用顶部
        if (ui) {
            if (typeof ui == "number") {
                uiView = this.getUI(ui);
            } else {
                uiView = (ui as UIView);
            }
        }

        return new Promise((resolve, reject) => {
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
        })
    }














    // =====================私有方法=========================
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
            if (this._UIStack[i].UIView._priority > uiInfo.UIView._priority) {
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

}


