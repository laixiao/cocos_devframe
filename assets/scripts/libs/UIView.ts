import { _decorator, Component, Node, Enum, CCBoolean, Prefab } from 'cc';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;

/* 界面展示类型 */
export enum UIShowTypes {
    Addition,         // 叠加显示
    Single,           // 单界面显示
}

export interface UIViewData {
    fromUI: number, //从哪个页面过来的
    args: any       //携带的参数
}

@ccclass('UIView')
export class UIView extends Component {
    _uuid: number = 0;
    _prefab: Prefab = null;
    _priority: number = 0;

    @property({ type: CCBoolean, displayName: "是否缓存" })
    cache: Boolean;

    @property({ type: Enum(UIShowTypes), displayName: "显示方式" })
    type: UIShowTypes = UIShowTypes.Single;

    /**
     * 监听-页面打开
     */
    public onOpen(data: UIViewData): void {

    }

    /**
     * 监听-页面关闭
     */
    public onClose(): void {

    }

    /**
    *  监听-上一个页面关闭
    */
    public onCloseLastUi(data: UIViewData): void {

    }

    close() {
        UIManager.instance.close(this._uuid);
    }


}


