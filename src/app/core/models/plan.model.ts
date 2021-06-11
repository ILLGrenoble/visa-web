import {JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from './flavour.model';
import {Image} from './image.model';

@JsonObject('Plan')
export class Plan {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('image', Image)
    private _image: Image = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('preset', Boolean)
    private _preset: boolean = undefined;

    constructor() {

    }

    public copy(data: Plan): Plan {
        this.id = data.id;
        this.image = data.image;
        this.flavour = data.flavour;
        this.preset = data.preset;
        return this;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get image(): Image {
        return this._image;
    }

    public set image(value: Image) {
        this._image = value;
    }

    public get flavour(): Flavour {
        return this._flavour;
    }

    public set flavour(value: Flavour) {
        this._flavour = value;
    }

    public get preset(): boolean {
        return this._preset;
    }

    public set preset(value: boolean) {
        this._preset = value;
    }
}
