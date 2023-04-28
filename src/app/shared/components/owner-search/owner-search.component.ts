import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {AccountService, InstrumentService} from '@core';
import {concat, Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap, tap} from 'rxjs/operators';
import {User} from "../../../core";

@Component({
    selector: 'visa-owner-search',
    templateUrl: './owner-search.component.html',
})
export class OwnerSearchComponent implements OnInit {

    private _form: FormGroup;

    private _loading = false;

    private _input$ = new Subject<string | null>();

    private _users$: Observable<User[]>;

    get users$(): Observable<any[]> {
        return this._users$;
    }

    set users$(value: Observable<any[]>) {
        this._users$ = value;
    }

    get form(): FormGroup {
        return this._form;
    }

    @Input()
    set form(value: FormGroup) {
        this._form = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get input$(): Subject<string | null> {
        return this._input$;
    }

    set input$(value: Subject<string | null>) {
        this._input$ = value;
    }

    constructor(private instrumentService: InstrumentService,
                private accountService: AccountService) {
    }

    public ngOnInit(): void {
        this._users$ = concat(
            of([]), // default items
            this._input$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                tap(() => this._loading = true),
                switchMap((term) => this.accountService.getUsersByLastName(term).pipe(tap(() => this._loading = false))),
            ),
        );
    }
}
