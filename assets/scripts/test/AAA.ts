import { _decorator, Component, Node } from 'cc';
import { UICF, UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
import { UIView, UIViewData } from '../libs/UIView';
const { ccclass, property } = _decorator;

@ccclass('AAA')
export class AAA extends UIView {
    public onOpen(data: UIViewData): void {
        console.log(data)
    }

    update(deltaTime: number) {

    }

    public onCloseLastUi(data: UIViewData): void {
        console.log(UICF[data.fromUI], data)
    }

    openBBB() {
        UIManager.instance.open(UIID.BBB)
    }


}


