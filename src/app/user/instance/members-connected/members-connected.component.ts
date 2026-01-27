import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Instance, User} from '@core';
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-instance-members-connected-dialog',
    styleUrls: ['./members-connected.component.scss'],
    templateUrl: './members-connected.component.html',
})
export class MembersConnectedComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _users = [];
    private _user: User;
    private _instance: Instance;

    private _onDropUser$: EventEmitter<User> = new EventEmitter<User>();

    private _showModal$: Subject<boolean>;
    private _showModal: boolean = false;

    get instance(): Instance {
        return this._instance;
    }

    @Input()
    set instance(value: Instance) {
        this._instance = value;
    }

    get user(): User {
        return this._user;
    }

    @Input()
    set user(value: User) {
        this._user = value;
    }

    get users(): any[] {
        return this._users;
    }

    @Input()
    set users(value: any[]) {
        this._users = value;
    }

    get showModal(): boolean {
        return this._showModal;
    }

    set showModal(value: boolean) {
        this._showModal = value;
    }

    @Input()
    set showModal$(value: Subject<boolean>) {
        this._showModal$ = value;
    }

    @Output()
    get onDropUser(): EventEmitter<User> {
        return this._onDropUser$;
    }

    constructor() {
    }

    public ngOnInit(): void {
        this._showModal$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(showModal => {
            this._showModal = showModal;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public canDelete(user: User): boolean {
        if (this._user == null) {
            return false;
        }
        if (this._instance.membership.role !== 'OWNER') {
            return false;
        }
        if (this._instance.membership.user.id === user.id) {
            return false;
        }
        return true;
    }

    public dropUser(event, user: User): void {
        event.preventDefault();
        this._onDropUser$.next(user);
    }

}
