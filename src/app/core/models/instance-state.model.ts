import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public deserialize(date: any): Date {
        return date == null ? null : new Date(date);
    }
}

@JsonObject('InstanceState')
export class InstanceState {

    @JsonProperty('state', String)
    private _state: string = undefined;

    @JsonProperty('expirationDate', DateConverter)
    private _expirationDate: Date = undefined;

    @JsonProperty('terminationDate', DateConverter)
    private _terminationDate: Date = undefined;

    @JsonProperty('deleteRequested', Boolean)
    private _deleteRequested: boolean = undefined;

    @JsonProperty('activeProtocols', [String])
    private _activeProtocols: string[] = undefined;

    public get state(): string {
        return this._state;
    }

    public set state(value: string) {
        this._state = value;
    }

    public get expirationDate(): Date {
        return this._expirationDate;
    }

    public set expirationDate(value: Date) {
        this._expirationDate = value;
    }

    public get terminationDate(): Date {
        return this._terminationDate;
    }

    public set terminationDate(value: Date) {
        this._terminationDate = value;
    }

    get deleteRequested(): boolean {
        return this._deleteRequested;
    }

    set deleteRequested(value: boolean) {
        this._deleteRequested = value;
    }

    get activeProtocols(): string[] {
        return this._activeProtocols;
    }

    set activeProtocols(value: string[]) {
        this._activeProtocols = value;
    }

}
