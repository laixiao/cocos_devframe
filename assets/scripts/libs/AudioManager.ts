import { AssetManager, assetManager, AudioClip, AudioSource, game, Node } from "cc";

/**
 * @class AudioManager
 * @author lx
 * 
 * TODO  音频管理器
 */
export default class AudioManager {
    private static _instance: AudioManager = null;

    public static get instance() {
        if (AudioManager._instance === null) {
            AudioManager._instance = new AudioManager();
        }
        return AudioManager._instance;
    }
    public static set instance(value) {
        AudioManager._instance = value;
    }

    private _audioSource: AudioSource = null;
    private _clips = {};
    private _clipTimes = {};
    // 音效总开关
    public audioSwitch: boolean = true;


    constructor() {
        let audioPersistRootNode = new Node("AudioPersistRootNode");
        this._audioSource = audioPersistRootNode.addComponent(AudioSource);
        game.addPersistRootNode(audioPersistRootNode);
    }

    private getBundle(name: string): any {
        return new Promise((resolve, reject) => {
            if (assetManager.getBundle(name)) {
                resolve(assetManager.getBundle(name));
            } else {
                assetManager.loadBundle(name, (err) => {
                    resolve(assetManager.getBundle(name));
                })
            }
        })
    }

    /* 
        加载音乐文件
    */
    private getClip(name: string) {
        return new Promise<AudioClip>((resolve, reject) => {
            if (this._clips[name]) {
                resolve(this._clips[name]);
            } else {
                this.getBundle("sound").then((bundle: AssetManager.Bundle) => {
                    bundle.load(name, (err, clip: AudioClip) => {
                        if (err) {
                            console.error(err)
                            reject(null);
                        } else {
                            this._clips[name] = clip;
                            resolve(clip);
                        }
                    })
                })
            }
        });
    }

    playSound(name: string, loop: boolean = false, volume: number = 1) {
        if (this.audioSwitch) {
            // 限制1s内播放数量
            if (!this._clipTimes[name]) {
                this._clipTimes[name] = 1
            }
            // console.log(new Date().getTime() - this._clipTimes[name])
            if (new Date().getTime() - this._clipTimes[name] > 50) {
                this._clipTimes[name] = new Date().getTime()
                this.getClip(name).then((clip: AudioClip | null) => {
                    if (clip) {
                        if (loop) {
                            this._audioSource.clip = clip;
                            this._audioSource.loop = loop;
                            this._audioSource.volume = volume;
                            this._audioSource.play();
                        } else {
                            this._audioSource.playOneShot(clip, volume)
                        }
                    }
                })
            }
        }
    }

    /* 获取音频时长 */
    getClipDuration(url: string): number | null {
        if (this._clips[url].clip) {
            return this._clips[url].clip.duration;
        } else {
            return null
        }
    }

    /* 
        停止播放音效
    */
    stopSound(url: string) {
        if (this._audioSource) {
            this._audioSource.stop();
        }
    }






}