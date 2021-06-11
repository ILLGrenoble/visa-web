import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cloneDeep} from 'lodash';
import {CloudFlavour, Flavour, FlavourConnection, PageInfo, Pagination} from '../../../core/graphql/types';
import {FlavourService} from '../../services/';
import {FlavourNewComponent} from '../flavour-new';
import {FlavourUpdateComponent} from '../flavour-update';
import {FlavourDeleteComponent} from '../flavour-delete';

@Component({
    selector: 'visa-admin-flavours',
    styleUrls: ['./flavours.component.scss'],
    templateUrl: './flavours.component.html',
})

export class FlavoursComponent implements OnInit {

    @ViewChild('datagridRef') public datagrid: any;

    public pageInfo: PageInfo;
    public pageSize = 20;
    public cloudFlavours: CloudFlavour[] = [];
    public flavourCloudFlavourName: string[] = [];
    public flavours: Flavour[] = [];
    private flavourConnection: FlavourConnection;
    private flavourPagination: Pagination;
    private state = {page: {from: 0, size: this.pageSize}};

    public loading: boolean;

    constructor(private flavourService: FlavourService,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public async ngOnInit(): Promise<void> {
        this.flavourPagination = {offset: this.state.page.from, limit: this.state.page.size};
        await this.loadAll();
    }

    public async onRefresh(): Promise<void> {
        await this.loadAll();
    }

    public async loadAll(): Promise<void> {
        this.loading = true;
        const {flavourConnection, cloudFlavours} = await this.flavourService.getAll(this.flavourPagination);
        this.flavours = flavourConnection.data;
        this.pageInfo = flavourConnection.pageInfo;
        this.cloudFlavours = cloudFlavours;
        this.flavourCloudFlavourName = this.cloudFlavourNameMap(cloudFlavours);
        this.loading = false;
    }

    public async loadFlavours(): Promise<void> {
        this.loading = true;
        this.flavourConnection = await this.flavourService.getFlavours(this.flavourPagination);
        this.flavours = this.flavourConnection.data;
        this.pageInfo = this.flavourConnection.pageInfo;
        this.loading = false;
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
        dialogRef.componentInstance.create.subscribe((data: any) => {
            this.flavourService.createFlavour(data).then(() => {
                dialogRef.close();
                this.flavourSnackBar('Flavour created');
                this.loadAll().then();
            }).catch((error) => {
                this.flavourSnackBar(error);
            });

        });
    }

    public onDelete(flavourId): void {
        const dialogRef = this.dialog.open(FlavourDeleteComponent, {
            width: '300px', data: {flavour: this.flavours.find((x) => x.id === flavourId)},
        });
        dialogRef.componentInstance.delete.subscribe(async () => {
            const response = await this.flavourService.deleteFlavour(flavourId).then();
            if (response) {
                this.flavourSnackBar('Flavour deleted');
                await this.loadFlavours();
            }
        });
    }

    public onUpdate(flavour): void {
        const dialogRef = this.dialog.open(FlavourUpdateComponent, {
            width: '800px', data: {
                flavour: cloneDeep(flavour),
                cloudFlavours: this.cloudFlavours,
            },
        });
        dialogRef.componentInstance.update.subscribe(async (data) => {
            this.flavourService.updateFlavour(flavour.id, data).then(() => {
                dialogRef.close();
                this.flavourSnackBar('Flavour updated');
                this.loadAll().then();
            }).catch((error) => {
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
