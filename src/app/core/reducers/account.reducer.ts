import {createReducer, createSelector, on} from '@ngrx/store';
import {AccountActions} from '../actions';
import {AccountState, ApplicationState} from '../state';

export const initialAccountState: AccountState = {
    user: null,
    bookingAccess: null,
};

const reducer = createReducer(
    initialAccountState,
    on(AccountActions.loadAccountSuccess, (state, {user, bookingAccess}) => {
        return {...state, user, bookingAccess};
    }),
    on(AccountActions.loadAccount, () => initialAccountState),
    on(AccountActions.clearAccount, (state) => ({...state, user: null, bookingAccess: null})),
);

export function accountReducer(state, action): AccountState {
    return reducer(state, action);
}

export const selectLoggedInUser = createSelector(
    (state: ApplicationState) => state.account,
    (state: AccountState) => state.user,
);

export const selectAccountBookingAccess = createSelector(
    (state: ApplicationState) => state.account,
    (state: AccountState) => state.bookingAccess,
);
