import { _decorator, Component, Node, EffectAsset } from 'cc';
import { UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
const { ccclass, property } = _decorator;

@ccclass('scene')
export class scene extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    openAAA() {
        UIManager.instance.open(UIID.AAA, { nick: "home" })

    }



}


