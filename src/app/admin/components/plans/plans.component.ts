import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cloneDeep} from 'lodash';
import {Flavour, Image, Plan} from '../../../core/graphql/types';
import {PlanNewComponent} from '../plan-new';
import {PlanUpdateComponent} from '../plan-update';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-plans',
    styleUrls: ['./plans.component.scss'],
    templateUrl: './plans.component.html',
})

export class PlansComponent implements OnInit, OnDestroy {

    private _plans: Plan[] = [];

    private _loading: boolean;
    private _images: Image[] = [];
    private _flavours: Flavour[] = [];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get plans(): Plan[] {
        return this._plans;
    }

    get loading(): boolean {
        return this._loading;
    }

    constructor(private _apollo: Apollo,
                private _snackBar: MatSnackBar,
                private _dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.loadPlansImagesFlavours();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadPlansImagesFlavours();
    }

    public loadPlansImagesFlavours(): void {
        this._loading = true;

        this._apollo.query<any>({
            query: gql`
                query AllFlavours {
                    flavours {
                        id
                        name
                        memory
                        cpu
                        computeId
                    },
                    images {
                        id
                        name
                        version
                        description
                        visible
                        icon
                        computeId
                        protocols{
                            id
                            name
                        }
                    }
                }
            `,
        }).pipe(
            map(({data}) => ({flavours: data.flavours, images: data.images})),
            takeUntil(this._destroy$)
        ).subscribe(({flavours, images}) => {
            this._flavours = flavours;
            this._images = images;
            this._loading = false;
            this.loadPlans();
        });
    }

    public loadPlans(): void {
        this._apollo.query<any>({
            query: gql`
                query allPlans {
                    plans {
                        id
                        image {
                            id
                            name
                            description
                            version
                            icon
                            computeId
                            visible
                        }
                        flavour {
                            id
                            name
                            memory
                            cpu
                            computeId
                        }
                        preset
                    }
                }
            `,
        }).pipe(
            map(({data}) => (data.plans)),
            takeUntil(this._destroy$)
        ).subscribe(plans => {
            this._plans = plans;
        });
    }

    public onCreate(): void {
        const dialogRef = this._dialog.open(PlanNewComponent, {
            width: '800px',
            data: {images: this._images, flavours: this._flavours},
        });
        dialogRef.componentInstance.onCreate$.subscribe((planInput: any) => {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation CreatePlan($input: PlanInput!){
                        createPlan(input:$input) {
                            id
                            image {
                                id
                                name
                                description
                                icon
                                computeId
                                visible
                            }
                            flavour {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    }
                `,
                variables: {input: planInput},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.planSnackBar('Plan created');
                    this.loadPlans();
                })
                .catch((error) => {
                    this.planSnackBar(error);
                });
        });
    }

    public onUpdate(plan): void {
        const dialogRef = this._dialog.open(PlanUpdateComponent, {
            width: '800px', data: {
                plan: cloneDeep(plan), images: this._images, flavours: this._flavours,
            },
        });
        dialogRef.componentInstance.onUpdate$.subscribe((data) => {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation UpdatePlan($id: Int!,$input: PlanInput!){
                        updatePlan(id:$id,input:$input) {
                            id
                            image {
                                id
                                name
                                description
                                icon
                                computeId
                                visible
                            }
                            flavour {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    }
                `,
                variables: {id: plan.id, input: data},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.planSnackBar('Plan updated');
                    this.loadPlans();
                })
                .catch((error) => {
                    this.planSnackBar(error);
                });
        });
    }

    private planSnackBar(message): void {
        this._snackBar.open(message, 'OK', {
            duration: 4000,
        });

    }
}
