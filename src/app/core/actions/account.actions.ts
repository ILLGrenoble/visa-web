import {createAction, props} from '@ngrx/store';
import {User} from '../models';

export const loadAccount = createAction('[Account] Load account');

export const loadAccountSuccess = createAction(
    '[Account] Load account success',
    props<{ user: User }>(),
);
