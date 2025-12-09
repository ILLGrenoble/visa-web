import {Component, OnInit} from '@angular/core';
import {
    AbstractControl, FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from "@angular/forms";
import {ApplicationState, BookingUserConfiguration, Flavour, selectUserBookingConfiguration} from "../../../core";
import {filter, take} from "rxjs/operators";
import {Store} from "@ngrx/store";

const toDateString = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
}

const minLengthArray = (min: number): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control instanceof FormArray) {
            return control.length >= min ? null : { minLengthArray: { requiredLength: min, actualLength: control.length } };
        }
        return null;
    };
}

@Component({
    selector: 'visa-booking-new',
    templateUrl: './booking-new.component.html',
    styleUrls: ['./booking-new.component.scss'],
})
export class BookingNewComponent implements OnInit {

    private _form: FormGroup = new FormGroup({
        startDate: new FormControl(null, Validators.required),
        endDate: new FormControl({value: null, disabled: true}, Validators.required),
        flavourRequests: this._formBuilder.array([], [Validators.required, minLengthArray(1)]),
        comments: new FormControl(null, Validators.required),
    });
    private _startDate: Date;
    private _endDate: Date;

    private _bookingConfig: BookingUserConfiguration;
    private _flavours: Flavour[];

    private _minStartDate = toDateString(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));

    get form(): FormGroup {
        return this._form;
    }

    get flavourRequestsFormArray(): FormArray {
        return this._form.get('flavourRequests') as FormArray;
    }

    get minStartDate(): string {
        return this._minStartDate;
    }

    get maxStartDate(): string {
        return this.endDate ? this.endDate.toISOString() : null;
    }

    get minEndDate(): string {
        return this.startDate ? toDateString(this.startDate) : this._minStartDate;
    }

    get startDate(): Date {
        return this._startDate;
    }

    set startDate(value: Date) {
        this._startDate = value;
    }

    get endDate(): Date {
        return this._endDate;
    }

    set endDate(value: Date) {
        this._endDate = value;
    }

    get datesValid(): boolean {
        return this._startDate != null && this._endDate != null;
    }

    get flavourQuantitiesValid(): boolean {
        return this.flavourRequestsFormArray.controls.find(c => !c.valid) == null;
    }

    get reservationDurationDays(): number {
        if (this.datesValid) {
            return 1 + Math.floor((this._endDate.getTime() - this._startDate.getTime()) / (24 * 60 * 60 * 1000));
        }
        return 0;
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    constructor(private _formBuilder: FormBuilder,
                private _store: Store<ApplicationState>) {
    }

    ngOnInit(): void {
        this._store.select(selectUserBookingConfiguration).pipe(
            filter(bookingConfig => !!bookingConfig),
            take(1)
        ).subscribe(bookingConfig => {
            this._bookingConfig = bookingConfig;
            this._flavours = bookingConfig.flavourConfiguration.map(config => config.flavour).sort((f1: Flavour, f2: Flavour) => {
                if (f1.cpu > f2.cpu) return 1;
                if (f1.cpu < f2.cpu) return -1;
                return f1.memory - f2.memory;
            });
        });

        this._form.get('startDate').valueChanges.subscribe((value) => {
            if (value == null) {
                this._form.get('endDate').disable();
            } else {
                this._form.get('endDate').enable();
            }
        });
    }

    protected selectFlavour(flavour: Flavour): void {
        if (!this.isFlavourSelected(flavour)) {
            const flavourGroup = this._createFlavourRequestFormGroup(flavour);
            this.flavourRequestsFormArray.push(flavourGroup);

            const sorted = this.flavourRequestsFormArray.controls
                .map(c => c as FormGroup)
                .sort((c1: FormGroup, c2: FormGroup) => {
                    const f1 = c1.value.flavour;
                    const f2 = c2.value.flavour;
                    if (f1.cpu > f2.cpu) return 1;
                    if (f1.cpu < f2.cpu) return -1;
                    return f1.memory - f2.memory;
                });

            this.flavourRequestsFormArray.clear();
            sorted.forEach(c => this.flavourRequestsFormArray.push(c))
            this.flavourRequestsFormArray.markAsDirty();

        } else {
            const index = this.flavourRequestsFormArray.controls.findIndex((group: AbstractControl) => {
                const formFlavour = group.get('flavour')?.value as Flavour;
                return formFlavour?.id === flavour.id;
            });

            if (index !== -1) {
                this.flavourRequestsFormArray.removeAt(index);
                this.flavourRequestsFormArray.markAsDirty();
            }
        }
    }

    protected isFlavourSelected(flavour: Flavour): boolean {
        const {flavourRequests} = this._form.value;
        return flavourRequests.find(flavourRequest => flavourRequest.flavour === flavour);
    }

    protected isFlavourAvailable(flavour: Flavour): boolean {
        // TODO
        return true;
    }

    protected createBookingRequest(): void {

    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    private _createFlavourRequestFormGroup(flavour: Flavour): FormGroup {
        return this._formBuilder.group({
            flavour: [flavour, [Validators.required]],
            quantity: [null, [Validators.required]],
        });
    }
}
