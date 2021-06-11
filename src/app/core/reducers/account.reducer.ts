import {createReducer, createSelector, on} from '@ngrx/store';
import {AccountActions} from '../actions';
import {AccountState, ApplicationState} from '../state';

export const initialState: AccountState = {
    user: null,
};

const reducer = createReducer(
    initialState,
    on(AccountActions.loadAccountSuccess, (state, {user}) => ({...state, user})),
    on(AccountActions.loadAccount, () => initialState),
);

export function accountReducer(state, action): AccountState {
    return reducer(state, action);
}

export const selectLoggedInUser = createSelector(
    (state: ApplicationState) => state.account,
    (state: AccountState) => state.user,
);
