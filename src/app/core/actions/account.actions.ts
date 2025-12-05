import {createAction, props} from '@ngrx/store';
import {BookingFlavourConfiguration, User} from '../models';

export const loadAccount = createAction('[Account] Load account');
export const clearAccount = createAction('[Account] Clear account');
export const loadAccountSuccess = createAction(
    '[Account] Load account success',
    props<{ user: User, bookingConfig: BookingFlavourConfiguration[] }>(),
);


