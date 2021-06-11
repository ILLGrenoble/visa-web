import {Component, Inject, OnInit, Output} from '@angular/core';
import {AccountService, Cycle, Experiment, Instrument, Paginated} from '@core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClrDatagridStateInterface} from '@clr/angular';

export interface OrderBy {
    id: number;
    label: string;
    value: string;
    descending: boolean;
}

export interface ExperimentSearchConfig {
    instrument: Instrument;
    fromYear: number;
    toYear: number;
    orderBy: OrderBy;
    pageSize: number;
}

@Component({
    selector: 'visa-instance-experiment-select',
    templateUrl: './instance-experiment-select.component.html',
    styleUrls: ['./instance-experiment-select.component.scss'],
})
export class InstanceExperimentSelectComponent implements OnInit {

    @Output()
    public selected: Subject<Experiment> = new Subject();

    @Output()
    public searchConfig: BehaviorSubject<ExperimentSearchConfig> = new BehaviorSubject<ExperimentSearchConfig>(null);

    public instruments: Instrument[] = [];
    public instrument: Instrument = null;
    public loading = false;

    public fromYears: number[];
    public toYears: number[];
    public orderings: OrderBy[] = [
        {id: 0, label: 'date (oldest first)', value: 'date', descending: false },
        {id: 1, label: 'date (newest first)', value: 'date', descending: true },
        {id: 2, label: 'instrument', value: 'instrument', descending: false },
        {id: 3, label: 'proposal', value: 'proposal', descending: false }
    ];
    public orderBy: OrderBy = this.orderings[0];

    public pageSizes: number [] = [5, 10, 25, 50, 100];

    private _allYears: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
    private _fromYear: number;
    private _toYear: number;

    public experiments: Paginated<Experiment[]> = new Paginated(1, 1, this.pageSizes[0], []);

    get fromYear(): number {
        return this._fromYear;
    }

    set fromYear(value: number) {
        this._fromYear = value;
        this.toYears = this._allYears.getValue().filter(year => year >= this._fromYear);
    }

    get toYear(): number {
        return this._toYear;
    }

    set toYear(value: number) {
        this._toYear = value;
        this.fromYears = this._allYears.getValue().filter(year => year <= this._toYear);
    }

    constructor(public dialogRef: MatDialogRef<InstanceExperimentSelectComponent>,
                private accountService: AccountService,
                @Inject(MAT_DIALOG_DATA) public data) {
        const config: ExperimentSearchConfig = data.config;
        if (config) {
            this.instrument = config.instrument;
            this._fromYear = config.fromYear;
            this._toYear = config.toYear;
            this.orderBy = this.orderings.find(ordering => ordering.id === config.orderBy.id);
            this.experiments.limit = config.pageSize;
        }
    }

    public handlePageChange(page: number): void {
        this.fetchExperiments(page);
    }

    public ngOnInit(): void {
        this.fetchExperiments(1);

        this.accountService.getInstruments().subscribe(instruments => {
            this.instruments = instruments;
            if (this.instrument) {
                this.instrument = instruments.find(instrument => this.instrument.id === instrument.id);
            }
        });

        this.accountService.getExperimentYears().subscribe(years => {
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const allYears = Array.from({length: maxYear - minYear + 1}, (v, k) => minYear + k);
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
        this.accountService.getExperiments(this.experiments.limit, page, this.instrument, this.fromYear, this.toYear, this.orderBy)
            .subscribe((data) => {
                this.loading = false;
                this.experiments = data;
            });
    }

    public onClose(): void {
        const config: ExperimentSearchConfig = {
            instrument: this.instrument,
            fromYear: this._fromYear,
            toYear: this._toYear,
            orderBy: this.orderBy,
            pageSize: this.experiments.limit
        };
        this.searchConfig.next(config);

        this.dialogRef.close();
    }


}
