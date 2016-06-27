export class DesignerSettings {

    public scenes: Array<SceneSettings>;

}

export class SceneSettings {
    public width: Number;
    public height: Number;
    public backgroundImage: string;
    public backgroundColor:string;
}

export class RegionSettings {
    public width: Number;
    public height: Number;
    public xOffset: Number;
    public yOffset: Number;
    public backgroundImage: string;
}