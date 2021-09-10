import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cloneDeep} from 'lodash';
import {CloudFlavour, Flavour, FlavourLimit, PageInfo, Pagination} from '../../../core/graphql/types';
import {FlavourNewComponent} from '../flavour-new';
import {FlavourUpdateComponent} from '../flavour-update';
import {FlavourDeleteComponent} from '../flavour-delete';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-flavours',
    styleUrls: ['./flavours.component.scss'],
    templateUrl: './flavours.component.html',
})

export class FlavoursComponent implements OnInit, OnDestroy {

    @ViewChild('datagridRef') public datagrid: any;

    public pageInfo: PageInfo;
    public pageSize = 20;
    public cloudFlavours: CloudFlavour[] = [];
    public flavourCloudFlavourName: string[] = [];
    public flavours: Flavour[] = [];
    public flavourLimits: FlavourLimit[] = [];
    private state = {page: {from: 0, size: this.pageSize}};

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    public loading: boolean;

    constructor(private apollo: Apollo,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.loadAll();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadAll();
    }

    public loadAll(): void {
        this.loading = true;
        this.apollo.query<any>({
            query: gql`
                query AllFlavours {
                    flavours {
                        id
                        name
                        memory
                        cpu
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
            this.flavours = flavours;
            this.cloudFlavours = cloudFlavours;
            this.flavourLimits = flavourLimits;
            this.flavourCloudFlavourName = this.cloudFlavourNameMap(cloudFlavours);
            this.loading = false;
        });
    }

    public cloudFlavourNameMap(cloudFlavours: CloudFlavour[]): (string | null)[] {
        return this.flavours.map((flavour) => {
            const resultCloudFlavour = cloudFlavours.find((cloudFlavour) => cloudFlavour.id === flavour.computeId);
            if (resultCloudFlavour) {
                return resultCloudFlavour.name;
            } else {
                return null;
            }
        });
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(FlavourNewComponent, {
            width: '800px',
            data: {cloudFlavours: this.cloudFlavours},
        });
        dialogRef.componentInstance.create.subscribe((flavourInput: any) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation CreateFlavour($input: CreateFlavourInput!){
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
                    this.flavourSnackBar('Flavour created');
                    this.loadAll();
                })
                .catch((error) => {
                    this.flavourSnackBar(error);
                });
        });
    }

    public onDelete(flavourId): void {
        const dialogRef = this.dialog.open(FlavourDeleteComponent, {
            width: '300px', data: {flavour: this.flavours.find((x) => x.id === flavourId)},
        });
        dialogRef.componentInstance.delete.subscribe(() => {
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
                    this.flavourSnackBar('Flavour deleted');
                    this.loadAll();
                });
        });
    }

    public onUpdate(flavour): void {
        const dialogRef = this.dialog.open(FlavourUpdateComponent, {
            width: '800px', data: {
                flavour: cloneDeep(flavour),
                cloudFlavours: this.cloudFlavours,
                flavourLimits: this.flavourLimits,
            },
        });
        dialogRef.componentInstance.update.subscribe((flavourInput) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateFlavour($id: Int!,$input: UpdateFlavourInput!){
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
                    this.flavourSnackBar('Flavour updated');
                    this.loadAll();
                })
                .catch((error) => {
                    this.flavourSnackBar(error);
                });
        });
    }

    private flavourSnackBar(message): void {
        this.snackBar.open(message, 'OK', {
            duration: 4000,
        });

    }
}
