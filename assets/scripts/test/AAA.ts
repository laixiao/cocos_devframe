import { _decorator, Component, Node, Sprite, SpriteFrame, assetManager, v3 } from 'cc';
import PoolManager from '../libs/PoolManager';
import { UICF, UIID } from '../libs/UIConf';
import { UIManager } from '../libs/UIManager';
import { UIView, UIViewData } from '../libs/UIView';
const { ccclass, property } = _decorator;

@ccclass('AAA')
export class AAA extends UIView {
    @property(Sprite)
    icon: Sprite = null;

    public onOpen(data: UIViewData): void {
        console.log(data)

        // UIManager.instance.setSpriteFrame(this, "common/texture/alien_magic/spriteFrame", this.icon).then((spriteFrame: SpriteFrame) => { });

        // this.scheduleOnce(() => {
        //     UIManager.instance.setSpriteFrame(this, "common/texture/alien_tongue/spriteFrame", this.icon);
        // }, 3)

        // https://oss.99huyu.cn/adsense/production/chengyu/大开眼界.png


        // this.schedule(this.spawnEnemy, 1, 5);



    }
    spawnEnemy() {
        PoolManager.instance.getItemSync("common/prefab/Enemy").then((node: Node) => {
            if (node) {
                node.parent = this.icon.node;
                node.setPosition(v3(Math.random() * 300, Math.random() * 300, 0))

            }
        })
    }

    update(deltaTime: number) {

    }

    onDisable() {
        for (let i = 0; i < this.icon.node.children.length; i++) {
            PoolManager.instance.putItem("common/prefab/Enemy", this.icon.node.children[i], true)
        }
    }

    public onCloseLastUi(data: UIViewData): void {
        // console.log(UICF[data.fromUI], data)

    }

    openBBB() {
        UIManager.instance.open(UIID.BBB, null, (finished: number, total: number, item: any) => {
            console.log(finished, total)
        }, (err, uiView: UIView) => {
            console.log(err, uiView)
        })
        // UIManager.instance.open(UIID.CCC)
    }

    btnClose() {
        UIManager.instance.close(this)

    }

    testBtn() {
        UIManager.instance.open(UIID.AAA, { nick: "AAA" })
        console.log(assetManager)
    }

}


