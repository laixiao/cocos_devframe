import { _decorator, Component, Node, Sprite } from 'cc';
import { UICF, UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
import { UIView, UIViewData } from '../libs/UIView';
const { ccclass, property } = _decorator;

@ccclass('BBB')
export class BBB extends UIView {
    @property(Sprite)
    icon: Sprite = null;

    public onOpen(data: UIViewData): void {
        console.log(data)

        UIManager.instance.setSpriteFrame(this, "https://oss.99huyu.cn/adsense/production/chengyu/大开眼界.png", this.icon)

        // UIManager.instance.setSpriteFrame(this, "common/texture/alien_tongue/spriteFrame", this.icon);

    }

    update(deltaTime: number) {

    }

    public onCloseLastUi(data: UIViewData): void {
        console.log(UICF[data.fromUI], data)
    }

    openCCC() {
        UIManager.instance.open(UIID.CCC)
    }

    btnClose() {
        UIManager.instance.close()
    }

    replaceBtn() {
        UIManager.instance.replace(UIID.CCC)
    }


}


