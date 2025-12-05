import {createReducer, createSelector, on} from '@ngrx/store';
import {AccountActions} from '../actions';
import {AccountState, ApplicationState} from '../state';

export const initialAccountState: AccountState = {
    user: null,
    bookingConfig: [],
};

const reducer = createReducer(
    initialAccountState,
    on(AccountActions.loadAccountSuccess, (state, {user, bookingConfig}) => {
        return {...state, user, bookingConfig};
    }),
    on(AccountActions.loadAccount, () => initialAccountState),
    on(AccountActions.clearAccount, (state) => ({...state, user: null, bookingConfig: []})),
);

export function accountReducer(state, action): AccountState {
    return reducer(state, action);
}

export const selectLoggedInUser = createSelector(
    (state: ApplicationState) => state.account,
    (state: AccountState) => state.user,
);
