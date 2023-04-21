import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {AccountService, InstancesFilterState, Instrument, InstrumentService} from '@core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-support-instances-filter',
    templateUrl: './instances-filter.component.html',
    styleUrls: ['./instances-filter.component.scss']
})
export class InstancesFilterComponent implements OnInit, OnDestroy {

    private _state: InstancesFilterState;

    private _onState: EventEmitter<InstancesFilterState> = new EventEmitter();

    private _form: UntypedFormGroup;

    private _instruments: Instrument[];

    private _loading = true;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    @Output()
    public get onState(): EventEmitter<InstancesFilterState> {
        return this._onState;
    }

    public set onState(value: EventEmitter<InstancesFilterState>) {
        this._onState = value;
    }

    public get instruments(): Instrument[] {
        return this._instruments;
    }

    public set instruments(value: Instrument[]) {
        this._instruments = value;
    }

    public get state(): InstancesFilterState {
        return this._state;
    }

    @Input()
    public set state(value: InstancesFilterState) {
        this._state = value;
    }

    public get form(): UntypedFormGroup {
        return this._form;
    }

    public set form(value: UntypedFormGroup) {
        this._form = value;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value: boolean) {
        this._loading = value;
    }

    constructor(private instrumentService: InstrumentService, private accountService: AccountService) {
        this._form = this.createForm();
    }

    ngOnInit(): void {
        this.form.patchValue(this.state.filters);
        this.instrumentService.getInstruments().pipe(takeUntil(this.destroy$)).subscribe(instruments => {
            this.loading = false;
            this.instruments = instruments;
        });
        if (this.state.filters.owner != null) {
            this.accountService.getUserById(this.state.filters.owner).pipe(takeUntil(this.destroy$)).subscribe(user => {
                this.form.get('owner').patchValue(user);
            }, error => {
                this.form.get('owner').patchValue(null);
                this.onState.emit(this.processForm());
            });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public onReset(): void {
        this.form.reset();
        this.onState.emit({
            ...this.state,
            filters: {
                id: null,
                name: null,
                owner: null,
                instrument: null
            },
            page: 1
        });
    }

    public onSubmit(): void {
        this.onState.emit(this.processForm());
    }

    private createForm(): UntypedFormGroup {
        return new UntypedFormGroup({
            id: new UntypedFormControl(null),
            name: new UntypedFormControl(null),
            owner: new UntypedFormControl(null),
            instrument: new UntypedFormControl(null)
        });
    }

    private processForm(): InstancesFilterState {
        const {id, name, owner, instrument} = this.form.value;
        return {
            ...this.state,
            filters: {
                id,
                name,
                owner: owner ? owner.id : null,
                instrument
            },
            page: 1
        };
    }
}
