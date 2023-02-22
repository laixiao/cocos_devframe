import { _decorator, Component, Node } from 'cc';
import { UICF, UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
import { UIView, UIViewData } from '../libs/UIView';
const { ccclass, property } = _decorator;

@ccclass('BBB')
export class BBB extends UIView {
    public onOpen(data: UIViewData): void {
        console.log(data)
    }

    update(deltaTime: number) {
        
    }

    public onCloseLastUi(data: UIViewData): void {
        console.log(UICF[data.fromUI], data)
    }

    openCCC(){
        UIManager.instance.open(UIID.CCC)
    }



}


