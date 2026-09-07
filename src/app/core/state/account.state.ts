import {AccountBookingAccess, User} from '../models';

export interface AccountState {
    user: User;
    bookingAccess: AccountBookingAccess;
}
