export enum UIID {
    AAA,
    BBB,
    CCC
}
export let UICF: { [key: number]: UIConf } = {
    [UIID.AAA]: { bundle: "common", path: "prefab/AAA", priority: 1, loading: true },
    [UIID.BBB]: { bundle: "common", path: "prefab/BBB", priority: 2 },
    [UIID.CCC]: { bundle: "common", path: "prefab/CCC", priority: 2 },

}

/** UI配置结构体 */
export interface UIConf {
    bundle: string;         //所在的bundle
    path: string;         //预制体
    priority: number;      //优先级
    loading?: boolean;      //加载prefab时是否显示loading
}
