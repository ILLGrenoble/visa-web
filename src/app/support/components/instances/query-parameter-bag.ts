import { Params } from '@angular/router';

export class QueryParameterBag {

    private _params: Params;

    private get params(): Params {
        return this._params;
    }
    private set params(value: Params) {
        this._params = value;
    }

    constructor(params: Params) {
        this.params = params;
    }

    getNumber(name: string, defaultValue: number): number {
        const param = this.params[name];
        if (param) {
            return Number(param);
        }
        return defaultValue;
    }

    getString(name: string, defaultValue: string): string {
        const param = this.params[name];
        if (param) {
            return param;
        }
        return defaultValue;
    }


    getBoolean(name: string, defaultValue: boolean): boolean{
        const param = this.params[name];
        if (param) {
            return param.toLowerCase() === 'true';
        }
        return defaultValue;
    }

    getList(name: string, defaultValue: []): string[] {
        const param = this.params[name];
        if (param) {
            return param.split(',');
        }
        return defaultValue;
    }
}
