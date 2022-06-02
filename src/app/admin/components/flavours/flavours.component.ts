import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {cloneDeep} from 'lodash';
import {CloudFlavour, Flavour, FlavourLimit, Instrument} from '../../../core/graphql';
import {FlavourNewComponent} from '../flavour-new';
import {FlavourUpdateComponent} from '../flavour-update';
import {FlavourDeleteComponent} from '../flavour-delete';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'visa-admin-flavours',
    styleUrls: ['./flavours.component.scss'],
    templateUrl: './flavours.component.html',
})

export class FlavoursComponent implements OnInit, OnDestroy {

    private _cloudFlavours: CloudFlavour[] = [];
    private _flavours: Flavour[] = [];
    private _flavourLimits: FlavourLimit[] = [];
    private _instruments: Instrument[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading: boolean;

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get loading(): boolean {
        return this._loading;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private dialog: MatDialog,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Flavours | Cloud | Admin | VISA`);
        this.loadAll();
        this.loadInstruments();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadAll();
    }

    public loadAll(): void {
        this._loading = true;
        this.apollo.query<any>({
            query: gql`
                query AllFlavours {
                    flavours {
                        id
                        name
                        memory
                        cpu
                        credits
                        computeId
                    }
                    flavourLimits  {
                        id
                        objectId
                        objectType
                        flavour {
                          id
                        }
                    }
                    cloudFlavours {
                      id
                      name
                      cpus
                      disk
                      ram
                  }
                }
            `,
        }).pipe(
            map(({data}) => ({flavours: data.flavours, cloudFlavours: data.cloudFlavours, flavourLimits: data.flavourLimits})),
            takeUntil(this._destroy$)
        ).subscribe(({flavours, cloudFlavours, flavourLimits}) => {
            this._flavours = flavours;
            this._cloudFlavours = cloudFlavours;
            this._flavourLimits = flavourLimits;
            this._loading = false;
        });
    }

    private loadInstruments(): void {
        this.apollo.query<any>({
            query: gql`
                query instruments {
                    instruments {
                        id
                        name
                   }
                }
            `,
        }).pipe(
            map(({data}) => (data.instruments)),
            takeUntil(this._destroy$)
        ).subscribe((instruments) => {
            this._instruments = instruments;
        });
    }

    public cloudFlavourName(flavour: Flavour): string {
        const cloudFlavour = this._cloudFlavours.find(aCloudFlavour => aCloudFlavour.id === flavour.computeId);
        return cloudFlavour ? cloudFlavour.name : null;
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(FlavourNewComponent, {
            width: '800px',
            data: {
                cloudFlavours: this._cloudFlavours,
                instruments: this._instruments
            },
        });
        dialogRef.componentInstance.onCreate$.subscribe((flavourInput: any) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation CreateFlavour($input: FlavourInput!){
                        createFlavour(input:$input) {
                            id
                            name
                            memory
                            cpu
                            computeId
                        }
                    }
                `,
                variables: {input: flavourInput},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.showSuccessNotification('Flavour created');
                    this.loadAll();
                })
                .catch((error) => {
                    this.showErrorNotification(error);
                });
        });
    }

    public onDelete(flavourId): void {
        const dialogRef = this.dialog.open(FlavourDeleteComponent, {
            width: '300px', data: {flavour: this.flavours.find((x) => x.id === flavourId)},
        });
        dialogRef.componentInstance.onDelete$.subscribe(() => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation DeleteFlavour($id: Int!){
                        deleteFlavour(id:$id) {
                            id
                        }
                    }
                `,
                variables: {id: flavourId},
            }).toPromise()
                .then(() => {
                    this.showSuccessNotification('Flavour deleted');
                    this.loadAll();
                });
        });
    }

    public onUpdate(flavour): void {
        const dialogRef = this.dialog.open(FlavourUpdateComponent, {
            width: '800px', data: {
                flavour: cloneDeep(flavour),
                cloudFlavours: this._cloudFlavours,
                flavourLimits: this._flavourLimits,
                instruments: this._instruments
            },
        });
        dialogRef.componentInstance.onUpdate$.subscribe(({flavourInput, instruments}) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateFlavour($id: Int!,$input: FlavourInput!){
                        updateFlavour(id:$id,input:$input) {
                            id
                            name
                            memory
                            cpu
                            computeId
                        }
                    }
                `,
                variables: {id: flavour.id, input: flavourInput},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.showSuccessNotification('Flavour updated');
                    this.loadAll();
                })
                .catch((error) => {
                    this.showErrorNotification(error);
                });

        });
    }

    private showSuccessNotification(message): void {
        this.notifierService.notify('success', message);
    }

    private showErrorNotification(message): void {
        this.notifierService.notify('error', message);
    }
}
