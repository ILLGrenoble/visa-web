import {createReducer, createSelector, on} from '@ngrx/store';
import {NotificationsActions} from '../actions';
import {NotificationsState, ApplicationState} from '../state';

export const initialNotificationsState: NotificationsState = {
    adminNotifications: [],
};

const reducer = createReducer(
    initialNotificationsState,
    on(NotificationsActions.loadNotificationsSuccess, (state, {adminNotifications}) => ({...state, adminNotifications})),
    on(NotificationsActions.loadNotifications, () => initialNotificationsState),
    on(NotificationsActions.clearNotifications, (state) => ({...state, adminNotifications: []})),
);

export function notificationsReducer(state, action): NotificationsState {
    return reducer(state, action);
}

export const selectAdminNotifications = createSelector(
    (state: ApplicationState) => state.notifications,
    (state: NotificationsState) => state?.adminNotifications
);
