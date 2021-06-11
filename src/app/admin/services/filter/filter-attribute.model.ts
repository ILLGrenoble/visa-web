export class FilterAttribute {

    private _alias: string;

    private _placeholder: string;

    private _comparator: string;

    constructor(alias: string, placeholder: string, comparator: string) {
        this.alias = alias;
        this.placeholder = placeholder;
        this.comparator = comparator;
    }

    public get alias(): string {
        return this._alias;
    }

    public set alias(value: string) {
        this._alias = value;
    }

    public get placeholder(): string {
        return this._placeholder;
    }

    public set placeholder(value: string) {
        this._placeholder = value;
    }

    public get comparator(): string {
        return this._comparator;
    }

    public set comparator(value: string) {
        this._comparator = value;
    }

}
