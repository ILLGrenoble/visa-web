import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {AccountService, Experiment, Instance} from '@core';
import {BehaviorSubject, Subject} from 'rxjs';
import {takeUntil, tap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';

@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

    private _instances: Instance[] = [];
    private _selectedExperiment: Experiment = null;
    private _refresh$: Subject<void> = new BehaviorSubject<void>(null);
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading = false;
    private _experiments: Experiment[] = [];

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get instances(): Instance[] {
        return this._instances;
    }

    set instances(value: Instance[]) {
        this._instances = value;
    }

    get selectedExperiment(): Experiment {
        return this._selectedExperiment;
    }

    set selectedExperiment(value: Experiment) {
        this._selectedExperiment = value;
    }

    get experiments(): Experiment[] {
        return this._experiments;
    }

    set experiments(value: Experiment[]) {
        this._experiments = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    constructor(private accountService: AccountService,
                private titleService: Title,
                private route: ActivatedRoute,
    ) {

    }

    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    public ngOnInit(): void {
        this.experiments = this.route.snapshot.data.instanceExperiments;
        this.titleService.setTitle(`Home | VISA`);
        this.refresh$.pipe(
            tap(() => this.loading = true),
            takeUntil(this.destroy$),
        ).subscribe(this.refresh.bind(this));
    }

    public refresh(): void {
        this.loading = true;
        this.accountService.getInstances()
            .then((instances) => {
                this.instances = instances;
                this.experiments = [].concat(...instances.map(instance => instance.experiments))
                    .filter((v, i, a) => {
                        return a.findIndex(t => (t.id === v.id)) === i;
                    });
                this.loading = false;
            });
    }

    public handleExperimentFilter(experiment: Experiment): void {
        this.selectedExperiment = experiment;
        this.refresh$.next();
    }

    public handleUpdate(): void {
        this.refresh$.next();
    }

}
