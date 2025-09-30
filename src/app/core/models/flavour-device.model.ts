import {JsonObject, JsonProperty} from 'json2typescript';
import {DevicePool} from "./device-pool.model";

@JsonObject('FlavourDevice')
export class FlavourDevice {

    @JsonProperty('devicePool', DevicePool, true)
    private _devicePool: DevicePool = undefined;

    @JsonProperty('unitCount', Number)
    private _unitCount: number = undefined;

    public copy(data: FlavourDevice): FlavourDevice {
        this._devicePool = data.devicePool;
        this._unitCount = data.unitCount;

        return this;
    }

    get devicePool(): DevicePool {
        return this._devicePool;
    }

    set devicePool(value: DevicePool) {
        this._devicePool = value;
    }

    get unitCount(): number {
        return this._unitCount;
    }

    set unitCount(value: number) {
        this._unitCount = value;
    }
}
