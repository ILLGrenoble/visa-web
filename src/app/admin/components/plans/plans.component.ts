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

    @ViewChild('datagridRef') public datagrid: any;

    public plans: Plan[] = [];

    public loading: boolean;
    private images: Image[] = [];
    private flavours: Flavour[] = [];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private apollo: Apollo,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.loadPlansImagesFlavours();
        setTimeout(() => this.datagrid.resize());
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadPlansImagesFlavours();
    }

    public loadPlansImagesFlavours(): void {
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
            this.flavours = flavours;
            this.images = images;
            this.loading = false;
            this.loadPlans();
        });
    }

    public loadPlans(): void {
        this.apollo.query<any>({
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
            this.plans = plans;
        });
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(PlanNewComponent, {
            width: '800px',
            data: {images: this.images, flavours: this.flavours},
        });
        dialogRef.componentInstance.create.subscribe((planInput: any) => {
            this.apollo.mutate<any>({
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
        const dialogRef = this.dialog.open(PlanUpdateComponent, {
            width: '800px', data: {
                plan: cloneDeep(plan), images: this.images, flavours: this.flavours,
            },
        });
        dialogRef.componentInstance.update.subscribe((data) => {
            this.apollo.mutate<any>({
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
        this.snackBar.open(message, 'OK', {
            duration: 4000,
        });

    }
}
