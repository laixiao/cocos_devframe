import { _decorator, Component, Node } from 'cc';
import { UICF, UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
import { UIView, UIViewData } from '../libs/UIView';
const { ccclass, property } = _decorator;

@ccclass('CCC')
export class CCC extends UIView {
    public onOpen(data: UIViewData): void {
        console.log(data)
    }

    update(deltaTime: number) {

    }

    public onCloseLastUi(data: UIViewData): void {
        console.log(UICF[data.fromUI], data)
    }

    openAAA() {
        UIManager.instance.open(UIID.AAA)
    }

    closeToUiBtn() {
        // UIManager.instance.closeToUi(UIID.AAA, { nick: "CCC" })
    }

    closeUIsBtn() {
        UIManager.instance.closeUIs({ include: [UIID.AAA, UIID.BBB] })
    }

}


