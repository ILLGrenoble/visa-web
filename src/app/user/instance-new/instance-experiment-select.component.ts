import {Component, Inject, OnInit, Output} from '@angular/core';
import {AccountService, Experiment, Instrument, Paginated} from '@core';
import {BehaviorSubject, Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClrDatagridStateInterface} from '@clr/angular';

export interface OrderBy {
    id: number;
    label: string;
    value: string;
    descending: boolean;
}

@Component({
    selector: 'visa-instance-experiment-select',
    templateUrl: './instance-experiment-select.component.html',
    styleUrls: ['./instance-experiment-select.component.scss'],
})
export class InstanceExperimentSelectComponent implements OnInit {

    private static USER_INSTANCE_EXPERIMENTS_INSTRUMENT_ID_KEY = 'user.instance.experiments.instrumentId';
    private static USER_INSTANCE_EXPERIMENTS_FROM_YEAR_KEY = 'user.instance.experiments.fromYear';
    private static USER_INSTANCE_EXPERIMENTS_TO_YEAR_KEY = 'user.instance.experiments.toYear';
    private static USER_INSTANCE_EXPERIMENTS_SORT_ID_KEY = 'user.instance.experiments.sortId';
    private static USER_INSTANCE_EXPERIMENTS_PAGE_SIZE_KEY = 'user.instance.experiments.pageSize';

    @Output()
    public selected: Subject<Experiment> = new Subject();

    public instruments: Instrument[] = [];
    private _instrument: Instrument = null;
    private _instrumentId: number;
    public loading = false;

    public fromYears: number[];
    public toYears: number[];
    public orderings: OrderBy[] = [
        {id: 0, label: 'date (oldest first)', value: 'date', descending: false},
        {id: 1, label: 'date (newest first)', value: 'date', descending: true},
        {id: 2, label: 'instrument', value: 'instrument', descending: false},
        {id: 3, label: 'proposal', value: 'proposal', descending: false}
    ];
    private _orderBy: OrderBy = this.orderings[1];

    public pageSizes: number [] = [5, 10, 25, 50, 100];

    private _allYears: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
    private _fromYear: number;
    private _toYear: number;

    public experiments: Paginated<Experiment[]> = new Paginated(1, 1, this.pageSizes[0], []);

    get instrument(): Instrument {
        return this._instrument;
    }

    set instrument(value: Instrument) {
        this._instrument = value;
        this._instrumentId = value ? value.id : null;
        if (this._instrumentId) {
            localStorage.setItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_INSTRUMENT_ID_KEY, `${this._instrumentId}`);
        } else {
            localStorage.removeItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_INSTRUMENT_ID_KEY);
        }
    }

    get fromYear(): number {
        return this._fromYear;
    }

    set fromYear(value: number) {
        this._fromYear = value;
        this.toYears = this._allYears.getValue().filter(year => year >= this._fromYear);
        localStorage.setItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_FROM_YEAR_KEY, `${this._fromYear}`);
    }

    get toYear(): number {
        return this._toYear;
    }

    set toYear(value: number) {
        this._toYear = value;
        this.fromYears = this._allYears.getValue().filter(year => year <= this._toYear);
        localStorage.setItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_TO_YEAR_KEY, `${this._toYear}`);
    }

    get orderBy(): OrderBy {
        return this._orderBy;
    }

    set orderBy(value: OrderBy) {
        this._orderBy = value;
        localStorage.setItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_SORT_ID_KEY, `${this._orderBy.id}`);
    }

    constructor(public dialogRef: MatDialogRef<InstanceExperimentSelectComponent>,
                private accountService: AccountService,
                @Inject(MAT_DIALOG_DATA) public data) {

        const localInstrumentId = localStorage.getItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_INSTRUMENT_ID_KEY);
        const localFromYear = localStorage.getItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_FROM_YEAR_KEY);
        const localToYear = localStorage.getItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_TO_YEAR_KEY);
        const localSortId = localStorage.getItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_SORT_ID_KEY);
        const localPageSize = localStorage.getItem(InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_PAGE_SIZE_KEY);

        if (localInstrumentId) {
            this._instrumentId = +localInstrumentId;
        }
        if (localFromYear) {
            this._fromYear = +localFromYear;
        }
        if (localToYear) {
            this._toYear = +localToYear;
        }
        if (localSortId) {
            this.orderBy = this.orderings.find(ordering => ordering.id === +localSortId);
        }
        if (localPageSize) {
            this.experiments.limit = +localPageSize;
        }
    }

    public handlePageChange(page: number): void {
        this.fetchExperiments(page);
    }

    public ngOnInit(): void {
        this.fetchExperiments(1);

        this.accountService.getInstruments().subscribe(instruments => {
            this.instruments = instruments;
            if (this._instrumentId) {
                this.instrument = instruments.find(instrument => this._instrumentId === instrument.id);
            }
        });

        this.accountService.getExperimentYears().subscribe(years => {
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const allYears = Array.from({length: maxYear - minYear + 1}, (v, k) => minYear + k).reverse();
            this._allYears.next(allYears);

            this.fromYear = !this._fromYear ? minYear : this._fromYear;
            this.toYear = !this._toYear ? maxYear : this._toYear;
        });

        this.dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this.onClose();
            }
        });

        this.dialogRef.backdropClick().subscribe(event => {
            this.onClose();
        });
    }

    public reload($event: any): void {
        this.fetchExperiments(1);
    }

    public refresh($event: ClrDatagridStateInterface): void {
        this.experiments.limit = $event.page.size;
        this.fetchExperiments($event.page.current);
    }

    private fetchExperiments(page: number): void {
        this.loading = true;
        this.accountService.getExperiments(this.experiments.limit, page, {
            instrumentId: this._instrumentId,
            fromYear: this.fromYear,
            toYear: this.toYear
        }, this.orderBy)
            .subscribe((data) => {
                this.loading = false;
                this.experiments = data;
                localStorage.setItem(
                    InstanceExperimentSelectComponent.USER_INSTANCE_EXPERIMENTS_PAGE_SIZE_KEY,
                    `${this.experiments.limit}`);
            });
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public navigateToExperimentURL(experiment: Experiment): void {
        const url = experiment.url || experiment.proposal.url;
        if (url) {
            window.open(url, '_blank');
        }
    }
}
