import {BookingUserConfiguration, User} from '../models';

export interface AccountState {
    user: User;
    bookingConfig: BookingUserConfiguration;
}
