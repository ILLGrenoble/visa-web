import {BookingFlavourConfiguration, User} from '../models';

export interface AccountState {
    user: User;
    bookingConfig: BookingFlavourConfiguration[];
}
