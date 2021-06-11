export class FilterParameter {

    private _name: string;

    private _value: any;

    constructor(name: string, value: any) {
        this.name = name;
        this.value = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get value(): any {
        return this._value;
    }

    public set value(value: any) {
        this._value = value;
    }

}
