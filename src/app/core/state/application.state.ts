import {AccountState} from './account.state';
import {InstanceState} from './instance.state';
import {NotificationsState} from './notifications.state';

export interface ApplicationState {
    account?: AccountState;
    instance?: InstanceState;
    notifications?: NotificationsState;
}
