import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {AccountService, ApplicationState, ConfigService, Experiment, Instance, selectLoggedInUser, User, Configuration} from '@core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, takeUntil, tap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';

@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

    private _user$: Observable<User>;
    private _user: User;

    private _instances: Instance[] = [];
    private _selectedExperiment: Experiment = null;
    private _refresh$: Subject<void> = new BehaviorSubject<void>(null);
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading = false;
    private _experiments: Experiment[] = [];
    private _configuration: Configuration;

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

    get isGuest(): boolean {
        return this._user != null && this._user.hasOnlyRole('GUEST');
    }

    get guestExpiryDate(): Date {
        if (this.isGuest) {
            return this._user.getUserRole('GUEST').expiresAt;
        }
        return null;
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    get user(): User {
        return this._user;
    }

    constructor(private accountService: AccountService,
                private titleService: Title,
                private route: ActivatedRoute,
                private store: Store<ApplicationState>,
                private configService: ConfigService,
    ) {
        this._user$ = store.select(selectLoggedInUser);
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

        this._user$.pipe(filter((user) => user != null)).subscribe((user) => {
            this._user = user;
        });

        this.configService.load()
            .pipe(takeUntil(this._destroy$))
            .subscribe((configuration) => {
                this._configuration = configuration;
            });
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
