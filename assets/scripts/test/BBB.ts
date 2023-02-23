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

        UIManager.instance.setSpriteFrame(this, "common/texture/alien_magic/spriteFrame", this.icon);

        // this.scheduleOnce(()=>{
        //     UIManager.instance.setSpriteFrame(this, "common/texture/alien_tongue/spriteFrame", this.icon);
        // },3)

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

    replaceBtn(){
        UIManager.instance.replace(UIID.CCC)
    }


}


