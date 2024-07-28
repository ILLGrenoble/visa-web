import {AccountState} from './account.state';
import {NotificationsState} from './notifications.state';

export interface ApplicationState {
    account?: AccountState;
    notifications?: NotificationsState;
}
