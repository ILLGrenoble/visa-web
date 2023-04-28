import {Injectable} from '@angular/core';
import {JsonConvert, OperationMode, ValueCheckingMode} from 'json2typescript';

@Injectable()
export class ObjectMapperService {
    private converter: JsonConvert;

    constructor() {
        const converter = new JsonConvert();
        converter.operationMode = OperationMode.ENABLE;
        converter.ignorePrimitiveChecks = false;
        converter.valueCheckingMode = ValueCheckingMode.ALLOW_NULL;
        this.converter = converter;
    }

    public deserialize<T extends object>(json: any, classReference: new() => T): T {
        return this.converter.deserializeObject<T>(json, classReference);
    }

    public serialize(data: any): any {
        return this.converter.serialize(data);
    }

}
