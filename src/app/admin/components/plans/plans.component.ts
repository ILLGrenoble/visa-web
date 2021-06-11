import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cloneDeep} from 'lodash';
import {Flavour, Image, PageInfo, Pagination, Plan, PlanConnection} from '../../../core/graphql/types';
import {FlavourService, ImageService, PlanService} from '../../services/';
import {PlanNewComponent} from '../plan-new';
import {PlanUpdateComponent} from '../plan-update';

@Component({
    selector: 'visa-admin-plans',
    styleUrls: ['./plans.component.scss'],
    templateUrl: './plans.component.html',
})

export class PlansComponent implements OnInit {

    @ViewChild('datagridRef') public datagrid: any;

    public pageInfo: PageInfo;
    public pageSize = 100;
    public plans: Plan[] = [];
    private planConnection: PlanConnection;
    private planPagination: Pagination;
    private pagination: Pagination;

    public loading: boolean;
    private images: Image[] = [];
    private flavours: Flavour[] = [];

    private state = {page: {from: 0, size: this.pageSize}};

    constructor(private planService: PlanService,
                private imageService: ImageService,
                private flavourService: FlavourService,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public async ngOnInit(): Promise<void> {

        this.planPagination = {offset: this.state.page.from, limit: this.state.page.size};
        this.pagination = {offset: 0};

        await this.loadPlansImagesFlavours();
        setTimeout(() => this.datagrid.resize());
    }

    public async onRefresh(): Promise<void> {
        await this.loadPlansImagesFlavours();
    }

    public async loadPlansImagesFlavours(): Promise<void> {
        this.loading = true;

        const [imageConnection, flavourConnection] = await Promise.all([
            this.imageService.getImages(this.pagination),
            this.flavourService.getFlavours(this.pagination),
        ]);

        this.images = imageConnection.data;
        this.flavours = flavourConnection.data;

        await this.loadPlans();
        this.loading = false;
    }

    public async loadPlans(): Promise<void> {
        this.planConnection = await this.planService.getPlans(this.planPagination);
        this.plans = this.planConnection.data;
        this.pageInfo = this.planConnection.pageInfo;
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(PlanNewComponent, {
            width: '800px',
            data: {images: this.images, flavours: this.flavours},
        });
        dialogRef.componentInstance.create.subscribe( (data: any) => {
             this.planService.createPlan(data).then(() => {
                 dialogRef.close();
                 this.planSnackBar('Plan created');
                 this.loadPlans().then();
             }).catch((error) => {
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
        dialogRef.componentInstance.update.subscribe( (data) => {
             this.planService.updatePlan(plan.id, data).then(() => {
                 dialogRef.close();
                 this.planSnackBar('Plan updated');
                 this.loadPlans().then();
             }).catch((error) => {
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
