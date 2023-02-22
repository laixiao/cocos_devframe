/*
 * @Author: LAIXIAO\laixiao 2515097216@qq.com
 * @Date: 2022-06-06 19:04:58
 */
import { _decorator, assetManager, AssetManager, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Util')
export class Util {

    private static _instance: Util = null;

    public static get instance() {
        if (Util._instance === null) {
            Util._instance = new Util();
        }
        return Util._instance;
    }
    public static set instance(value) {
        Util._instance = value;
    }

    /**
     * 例： Util.instance.getBundle(uiConf.bundle).then((bundle: AssetManager.Bundle)=>{ })
     * @param name  bundle name
     * @returns bundle
     */
    getBundle(name): Promise<AssetManager.Bundle> {
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

    /* 将秒转化为时分秒 */
    formatSecondsHMS(value) {
        let result = parseInt(value)
        let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
        let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
        let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
        return `${h}:${m}:${s}`;
    }

    /* 将秒转化为分秒 */
    formatSecondsMS(value) {
        let result = parseInt(value)
        let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
        let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
        let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
        return `${m}:${s}`;
    }

    /* 字符串判空 */
    isEmptyStr(s: string) {
        if (typeof s == 'string' && s.length > 0) {
            return false
        }
        return true
    }

    /* 获取唯一值 */
    spawnUniqueNum() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    // 获取随机整数
    public getRandom(min: number, max: number): number {
        return Math.round(Math.random() * (max - min) + min);
    }

    // 判断两个日期是否同一天
    isSameDay(d1: Date, d2: Date) {
        let d1t = d1.setUTCHours(0, 0, 0, 0);
        let d2t = d2.setUTCHours(0, 0, 0, 0);
        return d1t == d2t;
    }

    // 金币换算
    numberConvertThousand(value: number, fixed: number = 2): string {
        var k = 1000;
        var sizes = ['', 'K', 'M', "B", 'T'];
        if (value < k) {
            return value.toFixed(0).toString();
        }
        else {
            var i = Math.floor(Math.log(value) / Math.log(k));
            if (i > 4) {
                i = 4;
            }
            var r = ((value / Math.pow(k, i)));
            // 保留两位小数,第二位小数为0时隐藏
            let str = r.toFixed(fixed);
            if (str.split('.')[1].charAt(1) == '0') {
                fixed = 1;
            }
            return r.toFixed(fixed) + sizes[i];
        }
    }

}

