import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {concat, Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-user-search',
    templateUrl: './user-search.component.html',
})
export class UserSearchComponent implements OnInit {

    private _form: FormGroup;

    private _loading = false;

    private _input$ = new Subject<string | null>();

    private _users$: Observable<any[]>;

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

    constructor(private apollo: Apollo) {
    }

    public ngOnInit(): void {
        this.users$ = concat(
            of([]), // default items
            this._input$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                tap(() => this._loading = true),
                switchMap((term) => {
                    return this.apollo.query<any>({
                        errorPolicy: 'all',
                        query: gql`
                            query searchForUserByLastName($lastName: String!) {
                              searchForUserByLastName(
                                lastName: $lastName
                                pagination: { limit: 200, offset: 0 }
                              ) {
                                data {
                                  id
                                  firstName
                                  lastName
                                  fullName
                                }
                              }
                            }
                     `,
                        variables: {
                            lastName: term,
                        },
                    }).pipe(tap(() => this._loading = false), map((result) => {
                        if (result.data) {
                            return result.data.searchForUserByLastName.data;
                        }
                        return [];
                    }));
                }),
            ),
        );
    }
}
