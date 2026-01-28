import {JsonObject, JsonProperty} from 'json2typescript';
import {BookingFlavourConfiguration} from "./booking-flavour-configuration.model";


@JsonObject('BookingUserConfiguration')
export class BookingUserConfiguration {

    @JsonProperty('enabled', Boolean)
    private _enabled: boolean = undefined;

    @JsonProperty('flavourConfigurations', [BookingFlavourConfiguration])
    private _flavourConfiguration: BookingFlavourConfiguration[] = undefined;

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get flavourConfiguration(): BookingFlavourConfiguration[] {
        return this._flavourConfiguration;
    }

    set flavourConfiguration(value: BookingFlavourConfiguration[]) {
        this._flavourConfiguration = value;
    }

}
