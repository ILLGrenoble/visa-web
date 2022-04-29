import {createAction, props} from '@ngrx/store';
import {ClientNotification} from '../models';

export const loadNotifications = createAction('[Notifications] Load account');
export const clearNotifications = createAction('[Notifications] Clear account');
export const loadNotificationsSuccess = createAction(
    '[Notifications] Load account success',
    props<{ adminNotifications: ClientNotification[] }>(),
);


