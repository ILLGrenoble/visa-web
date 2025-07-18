import {AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {
    AccountService,
    AnalyticsService,
    ApplicationState,
    CatalogueService, ConfigService,
    Experiment,
    HelperService,
    ImagePlans,
    Instance,
    Plan,
    Protocol,
    Quota,
    selectLoggedInUser,
    User,
} from '@core';
import {Store} from '@ngrx/store';
import {InstanceForm} from '@shared';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {InstanceExperimentSelectComponent} from './instance-experiment-select.component';
import {MatDialog} from '@angular/material/dialog';
import {QueryParameterBag} from '../../admin/http';
import {NotifierService} from 'angular-notifier';
import {AbstractControl} from "@angular/forms";

@Component({
    selector: 'visa-instance-new',
    templateUrl: './instance-new.component.html',
    styleUrls: ['./instance-new.component.scss'],
})
export class InstanceNewComponent implements OnInit, OnDestroy, AfterViewChecked {

    private _user$: Observable<User>;
    private _user: User;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _experimentsObservable: BehaviorSubject<Experiment[]> = new BehaviorSubject<Experiment[]>([]);
    private _plans: Plan[] = null;
    private _selectedImagePlans: ImagePlans = null;
    private _selectedPlan: Plan = null;

    private _form: InstanceForm = new InstanceForm();

    private _canSubmit = true;
    private _experimentFree = false;
    private _quotas: Quota;
    private _totalExperiments: number;
    private _openDataIncluded: boolean;
    private _customiseInstance = false;
    private _contactEmail: string;

    private _errors: string[];


    get user(): User {
        return this._user;
    }

    get experiments(): Experiment[] {
        return this._experimentsObservable.getValue();
    }

    get plans(): Plan[] {
        return this._plans;
    }

    get form(): InstanceForm {
        return this._form;
    }

    set form(value: InstanceForm) {
        this._form = value;
    }

    get name(): AbstractControl {
        return this._form.get('name');
    }

    get comments(): AbstractControl {
        return this._form.get('comments');
    }

    get selectedImagePlans(): ImagePlans {
        return this._selectedImagePlans;
    }

    get stage(): number {
        if (this._experimentsObservable.getValue().length === 0 && this._experimentFree === false) {
            return 0;
        } else if (this._selectedPlan == null) {
            return 1;
        } else {
            return 2;
        }
    }

    get canBeExperimentFree(): boolean {
        return this._user != null && this._user.hasAnyRole(['ADMIN', 'STAFF', 'GUEST']);
    }

    get experimentFree(): boolean {
        return this._experimentFree;
    }

    set experimentFree(value: boolean) {
        this._experimentFree = value;
        this._selectedPlan = null;
        if (value) {
            this._experimentsObservable.next([]);
        }
    }

    get customiseInstance(): boolean {
        return this._customiseInstance;
    }

    set customiseInstance(value: boolean) {
        this._customiseInstance = value;
    }

    get canSkipCustomisation(): boolean {
        return this._plans != null && this._plans.find(plan => plan.preset) != null;
    }

    get quotas(): Quota {
        return this._quotas;
    }

    set quotas(value: Quota) {
        this._quotas = value;
    }

    get selectedPlan(): Plan {
        return this._selectedPlan;
    }

    get errors(): string[] {
        return this._errors;
    }

    get hasExperiments(): boolean {
        return this._totalExperiments > 0 || this._openDataIncluded;
    }

    get contactEmail(): string {
        return this._contactEmail;
    }

    constructor(private _accountService: AccountService,
                private _router: Router,
                private _helperService: HelperService,
                private _catalogueService: CatalogueService,
                private notifierService: NotifierService,
                private route: ActivatedRoute,
                private analyticsService: AnalyticsService,
                private titleService: Title,
                private store: Store<ApplicationState>,
                private cdr: ChangeDetectorRef,
                private configurationService: ConfigService,
                private dialog: MatDialog) {
        this._user$ = store.select(selectLoggedInUser);
    }

    public ngOnInit(): void {
        const title = `New instance | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);
        const {quotas, totalExperiments} = this.route.snapshot.data;
        this.quotas = quotas;
        this._totalExperiments = totalExperiments;
        this._user$.pipe(filter((user) => user != null)).subscribe((user) => {
            this._user = user;
        });

        this.configurationService.configuration$()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                this._openDataIncluded = config.experiments.openDataIncluded;
                this._contactEmail = config.contactEmail;

                this.route.queryParams.pipe(
                    map((params) => new QueryParameterBag(params)),
                ).subscribe((params: QueryParameterBag) => {
                    const proposals = params.getList('proposals', null);
                    const dois = params.getList('dois', null);
                    if (proposals || dois) {
                        const filters = {
                            ...(proposals && { proposals }),
                            ...(dois && { dois }),
                            includeOpenData: config.experiments.openDataIncluded,
                        };
                        this._accountService.getExperiments(100, 1, filters)
                            .subscribe((data) => {
                                this._experimentsObservable.next(data.items);
                                this._errors = data.errors;
                            });
                    }
                });

                // If user has no experiments and is allowed to create instances without experiements, then skip the experiment stage
                if (this._totalExperiments === 0 && this.canBeExperimentFree && !config.experiments.openDataIncluded) {
                    this.experimentFree = true;
                }
            });

        this._experimentsObservable.subscribe(experiments => {
            const experimentIds = experiments.map((experiment) => experiment.id);
            this._catalogueService.getPlansForExperiments(experimentIds).subscribe((plans) => {
                this._plans = plans;
            });
        });

        this.handleGenerateRandomName();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public ngAfterViewChecked(): void {
        this.cdr.detectChanges();
    }

    public addExperiment(newExperiment: Experiment): void {
        let experiments = this._experimentsObservable.getValue();
        if (experiments.find((experiment) => experiment.id === newExperiment.id) == null) {
            // Concat rather than push to force an update of the image select component
            experiments = experiments.concat(newExperiment);
            this._experimentsObservable.next(experiments);
        }
    }

    public handleGenerateRandomName(): void {
        this._helperService.getRandomInstanceName().subscribe((randomName) => {
            this.form.get('name').setValue(randomName);
        });
    }

    public removeExperiment(experiment: Experiment): void {
        let experiments = this._experimentsObservable.getValue();

        experiments = experiments.filter((experiment2) => experiment.id !== experiment2.id);
        this._experimentsObservable.next(experiments);
    }

    public setSelectedImagePlans(value: ImagePlans): void {
        this._selectedImagePlans = value;
    }

    public setSelectedPlan(value: Plan): void {
        this._selectedPlan = value;
    }

    public isValidData(): boolean {
        return this._selectedPlan != null &&
            (this._experimentsObservable.getValue().length > 0 || this._experimentFree) &&
            this.form.valid;
    }

    public canSubmit(): boolean {
        return this.isValidData() && this._canSubmit;
    }

    public createInstance(): void {

        if (this.isValidData()) {
            const {name, comments, screenResolution, keyboardLayout, vdiProtocol} = this.form.value;

            const instance: Instance = new Instance();
            instance.name = name;
            instance.comments = comments;
            instance.screenWidth = screenResolution.width;
            instance.screenHeight = screenResolution.height;
            instance.keyboardLayout = keyboardLayout;
            instance.plan = this._selectedPlan;
            instance.vdiProtocol = vdiProtocol;
            this._experimentsObservable.getValue().forEach((experiment) => instance.addExperiment(experiment));

            this._canSubmit = false;

            this._accountService.createInstance(instance, true)
                .subscribe({next: () => {
                    this._router.navigate([''], {replaceUrl: true});
                    this.notifierService.notify('success', 'Your instance is being created.');

                }, error: (error) => {
                    console.log('An error occurred: ' + error.message);
                    this._canSubmit = true;
                }});
        }
    }

    public setScreenResolution(resolution: { width: number; height: number }): void {
        this.form.get('screenResolution').setValue(resolution);
    }

    public setVdiProtocol(protocol: Protocol): void {
        this.form.get('vdiProtocol').setValue(protocol);
    }

    public setKeyboardLayout(value: { layout: string; name: string, selected: boolean }): void {
        if (value != null) {
            this.form.get('keyboardLayout').setValue(value.layout);
        }
    }

    public openExperimentSearch(): void {
        const dialogRef = this.dialog.open(InstanceExperimentSelectComponent, {
            width: 'max(1000px, 70%)', data: { totalUserExperiments: this._totalExperiments, openDataIncluded: this._openDataIncluded },
        });
        dialogRef.componentInstance.selected.subscribe((experiment: Experiment) => {
            this.addExperiment(experiment);
        });
    }

    public removeError(index: number): void {
        if (this._errors && this._errors.length > index) {
            this._errors.splice(index, 1);
        }
    }

    public navigateToExperimentURL(experiment: Experiment): void {
        const url = experiment.url || experiment.proposal.url;
        if (url) {
            window.open(url, '_blank');
        }
    }
}
