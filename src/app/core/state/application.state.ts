import {AccountState} from './account.state';
import {InstanceState} from './instance.state';

export interface ApplicationState {
    account?: AccountState;
    instance?: InstanceState;
}
