import {Component, Input, OnInit} from '@angular/core';
import {ApplicationState, BookingToken, selectLoggedInUser, User} from "../../../core";
import {FormGroup} from "@angular/forms";
import {Store} from "@ngrx/store";
import {Observable} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
    selector: 'visa-booking-token',
    templateUrl: './booking-token.component.html',
    styleUrls: ['./booking-token.component.scss'],
})
export class BookingTokenComponent implements OnInit {

    private _token: BookingToken;
    private _form: FormGroup;
    private _bookingActive: boolean;

    private _user$: Observable<User>;
    private _user: User;

    get token(): BookingToken {
        return this._token;
    }

    @Input()
    set token(value: BookingToken) {
        this._token = value;
    }

    get form(): FormGroup {
        return this._form;
    }

    @Input()
    set form(value: FormGroup) {
        this._form = value;
    }

    get bookingActive(): boolean {
        return this._bookingActive;
    }

    @Input()
    set bookingActive(value: boolean) {
        this._bookingActive = value;
    }

    constructor(store: Store<ApplicationState>) {
        this._user$ = store.select(selectLoggedInUser);
    }


    public ngOnInit(): void {
        this._user$.pipe(filter((user) => user != null)).subscribe((user) => {
            this._user = user;
        });
    }

    protected assignToMe(): void {
        this._form.get('owner').patchValue(this._user);
    }

    protected assignToMeDisabled(): boolean {
        const assignedUser: User = this._form.value.owner;
        return !(assignedUser == null || this._user.id != assignedUser.id);
    }

}
