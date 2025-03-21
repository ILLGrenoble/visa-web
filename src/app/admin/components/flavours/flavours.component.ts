import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Flavour, FlavourInput, Instrument, Role} from '../../../core/graphql';
import {FlavourDeleteComponent} from '../flavour-delete';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, filter, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {FlavourEditComponent} from '../flavour-edit';

@Component({
    selector: 'visa-admin-flavours',
    templateUrl: './flavours.component.html',
})

export class FlavoursComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _flavours: Flavour[] = [];
    private _instruments: Instrument[];
    private _roles: Role[];
    private _loading: boolean;
    private _multiCloudEnabled = false;

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _dialog: MatDialog,
                private readonly _titleService: Title) {
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get loading(): boolean {
        return this._loading;
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Flavours | Cloud | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query AllFlavours {
                            flavours {
                                id
                                name
                                memory
                                cpu
                                computeId
                                cloudFlavour {
                                    id
                                    name
                                    cpus
                                    ram
                                }
                                cloudClient {
                                    id
                                    name
                                }
                            }
                            instruments {
                                id
                                name
                            }
                            rolesAndGroups {
                                id
                                name
                            }
                            cloudClients {
                                id
                            }
                        }
                    `
                })),
                map(({data}) => ({
                    flavours: data.flavours,
                    instruments: data.instruments,
                    roles: data.rolesAndGroups,
                    cloudClients: data.cloudClients,
                })),
                tap(() => this._loading = false)
            )
            .subscribe(({flavours, instruments, roles, cloudClients}) => {
                this._flavours = flavours;
                this._instruments = instruments;
                this._roles = roles;
                this._multiCloudEnabled = cloudClients.length > 1 || flavours
                    .map((flavour) => flavour.cloudClient)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCreate(flavour?: Flavour): void {
        const dialogRef = this._dialog.open(FlavourEditComponent, {
            width: '800px',
            data: { flavour, instruments: this._instruments, roles: this._roles, clone: !!flavour },
        });
        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: FlavourInput) => {
                return this._apollo.mutate<any>({
                    mutation: gql`
                            mutation CreateFlavour($input: FlavourInput!){
                                createFlavour(input: $input) {
                                    id
                                    name
                                    memory
                                    cpu
                                    computeId
                                }
                            }
                        `,
                    variables: {input},
                }).pipe(
                    takeUntil(this._destroy$),
                );
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour created');
                    this._refresh$.next();
                    dialogRef.close();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }

    public onDelete(flavour: Flavour): void {
        const dialogRef = this._dialog.open(FlavourDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().pipe(
            filter(result => result),
            switchMap(() => {
                return this._apollo.mutate({
                    mutation: gql`
                        mutation DeleteFlavour($id: Int!){
                            deleteFlavour(id:$id) {
                                id
                            }
                        }
                    `,
                    variables: {id: flavour.id},
                }).pipe(
                    takeUntil(this._destroy$),
                )
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Successfully deleted flavour');
                    this._refresh$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }

    public onUpdate(flavour: Flavour): void {
        const dialogRef = this._dialog.open(FlavourEditComponent, {
            width: '800px', data: { flavour, instruments: this._instruments, roles: this._roles },
        });

        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: FlavourInput) => {
                return this._apollo.mutate<any>({
                    mutation: gql`
                        mutation UpdateFlavour($id: Int!, $input: FlavourInput!){
                            updateFlavour(id: $id, input: $input) {
                                id
                            }
                        }
                        `,
                    variables: {id: flavour.id, input},
                }).pipe(
                    takeUntil(this._destroy$)
                )
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour saved');
                    this._refresh$.next();
                    dialogRef.close();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }
}
