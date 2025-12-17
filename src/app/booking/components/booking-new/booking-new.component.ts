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
import {
    ApplicationState, BookingFlavourConfiguration,
    BookingRequestInput,
    BookingService,
    BookingUserConfiguration,
    Flavour, FlavourAvailabilitiesFuture, FlavourAvailability,
    selectUserBookingConfiguration
} from "../../../core";
import {combineLatestWith, filter, take, takeUntil} from "rxjs/operators";
import {Store} from "@ngrx/store";
import {NotifierService} from "angular-notifier";
import {Router} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";

const toDateString = (date: Date): string => {
    if (date == null) {
        return null;
    }
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

type BookingFlavourLimit = {
    flavour: Flavour;
    maxInstances: number;
    maxDaysInAdvance: number;
    maxReservationDays: number;
    available: boolean;
    message?: string;
}

@Component({
    selector: 'visa-booking-new',
    templateUrl: './booking-new.component.html',
    styleUrls: ['./booking-new.component.scss'],
})
export class BookingNewComponent implements OnInit {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _form: FormGroup = new FormGroup({
        startDate: new FormControl(null, Validators.required),
        endDate: new FormControl({value: null, disabled: true}, Validators.required),
        flavourRequests: this._formBuilder.array([], [Validators.required, minLengthArray(1)]),
        name: new FormControl(null, Validators.required),
        comments: new FormControl(null, Validators.required),
    });
    private _startDate: BehaviorSubject<Date> = new BehaviorSubject(null);
    private _endDate: BehaviorSubject<Date> = new BehaviorSubject(null);

    private _bookingConfig: BookingUserConfiguration;
    private _flavours: Flavour[];
    private _flavourAvailabilitiesFutures: FlavourAvailabilitiesFuture[];
    private _bookingFlavourLimits: BookingFlavourLimit[] = [];

    private _minStartDate = toDateString(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
    private _maxStartDateFromConfig: Date;

    private _showSubmitModal = false;
    private _sendingRequest = false;
    private _requestErrors: string[] = null;

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
        if (this._maxStartDateFromConfig) {
            if (this.endDate && this.endDate.getTime() < this._maxStartDateFromConfig.getTime()) {
                return toDateString(this.endDate);
            } else {
                return toDateString(this._maxStartDateFromConfig);
            }

        } else {
            return this.endDate ? this.endDate.toISOString() : null;
        }
    }

    get minEndDate(): string {
        return this.startDate ? toDateString(this.startDate) : this._minStartDate;
    }

    get startDate(): Date {
        return this._startDate.value;
    }

    set startDate(value: Date) {
        this._startDate.next(value);
    }

    get endDate(): Date {
        return this._endDate.value;
    }

    set endDate(value: Date) {
        this._endDate.next(value);
    }

    get flavourLimits(): BookingFlavourLimit[] {
        return this._bookingFlavourLimits;
    }

    get datesValid(): boolean {
        return this.startDate != null && this.endDate != null;
    }

    get flavourQuantitiesValid(): boolean {
        return this.flavourRequestsFormArray.controls.find(c => !c.valid) == null;
    }

    get reservationDurationDays(): number {
        if (this.datesValid) {
            return 1 + Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (24 * 60 * 60 * 1000));
        }
        return 0;
    }

    get reservationDaysInAdvance(): number {
        if (this.startDate != null) {
            return 1 + Math.floor((this.startDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        }
        return 0;
    }

    get showSubmitModal(): boolean {
        return this._showSubmitModal;
    }

    set showSubmitModal(value: boolean) {
        this._showSubmitModal = value;
    }

    get sendingRequest(): boolean {
        return this._sendingRequest;
    }

    get requestErrors(): string[] {
        return this._requestErrors;
    }

    constructor(private _formBuilder: FormBuilder,
                private _store: Store<ApplicationState>,
                private _notifierService: NotifierService,
                private _router: Router,
                private _bookingService: BookingService) {
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

            // Get a rough max start date for the reservation
            const maxStartDateFromConfig = bookingConfig.flavourConfiguration.reduce((acc: number, curr: BookingFlavourConfiguration) => {
                return acc == null ? curr.maxDaysInAdvance : curr.maxDaysInAdvance == null ? acc : Math.max(curr.maxDaysInAdvance, acc);
            }, null);
            if (maxStartDateFromConfig) {
                this._maxStartDateFromConfig = new Date(new Date().getTime() + maxStartDateFromConfig * 24 * 60 * 60 * 1000);
            }
        });

        this._startDate.pipe(
            filter(startDate => !!startDate),
            combineLatestWith(this._endDate),
            takeUntil(this._destroy$),
        ).subscribe(([startDate, endDate]) => {
            startDate == null ? this._form.get('endDate').disable() : this._form.get('endDate').enable();

            if (startDate && endDate) {
                this._bookingService.getFlavourAvailabilities(toDateString(startDate), toDateString(endDate)).subscribe((flavourAvailabilitiesFutures) => {
                    this._flavourAvailabilitiesFutures = flavourAvailabilitiesFutures;
                    this._updateFlavourLimits();
                })
            }
        });

    }

    protected toggleSelectFlavour(flavourLimit: BookingFlavourLimit): void {
        if (!flavourLimit.available) {
            return;
        }
        const flavour = flavourLimit.flavour;
        if (!this.isFlavourSelected(flavour)) {
            this._selectFlavour(flavour);

        } else {
            this._unselectFlavour(flavour);
        }
    }

    protected isFlavourSelected(flavour: Flavour): boolean {
        const {flavourRequests} = this._form.value;
        return flavourRequests.find(flavourRequest => flavourRequest.flavour === flavour);
    }

    protected createBookingRequest(): void {
        this._showSubmitModal = true;
        this._sendingRequest = true;
        this._requestErrors = null;

        const {name, comments, flavourRequests} = this._form.value;

        const flavourRequestInputs = flavourRequests.map(flavourRequest => {
            const {flavour, quantity} = flavourRequest;
            return {flavourId: flavour.id, quantity};
        });

        const input: BookingRequestInput = {
            startDate: toDateString(this.startDate),
            endDate: toDateString(this.endDate),
            name,
            comments,
            flavourRequests: flavourRequestInputs,
        }

        this._bookingService.createBookingRequest(input).subscribe({
            next: ({data, errors}) => {
                this._sendingRequest = false;
                if (errors) {
                    this._requestErrors = errors;
                } else {
                    this._notifierService.notify('success', 'Instance reservation request submitted');
                    this._router.navigate(['bookings'], {replaceUrl: true});

                }
            },
            error: error => {
                this._sendingRequest = false;
                this._requestErrors = [`Failed to send booking request: ${error.message}`];
            }
        })

    }

    protected closeSubmitModal(): void {
        this._showSubmitModal = false;
    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    protected getMaxInstancesForFlavour(flavour: Flavour): number {
        return this._bookingFlavourLimits.find(limit => limit.flavour.id === flavour.id)?.maxInstances;
    }

    private _createFlavourRequestFormGroup(flavour: Flavour): FormGroup {
        return this._formBuilder.group({
            flavour: [flavour, [Validators.required]],
            quantity: [null, [Validators.required, (control: AbstractControl) => this._flavourQuantityValidator(flavour, control.value)]],
        });
    }

    private _flavourQuantityValidator(flavour: Flavour, quantity: number): ValidationErrors | null {
        const limits = this._bookingFlavourLimits.find(limit => limit.flavour.id === flavour.id);
        return quantity > limits.maxInstances ? {limitExceeded: true} : null;
    }

    private _selectFlavour(flavour: Flavour): void {
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
    }

    private _unselectFlavour(flavour: Flavour): void {
        const index = this.flavourRequestsFormArray.controls.findIndex((group: AbstractControl) => {
            const formFlavour = group.get('flavour')?.value as Flavour;
            return formFlavour?.id === flavour.id;
        });

        if (index !== -1) {
            this.flavourRequestsFormArray.removeAt(index);
            this.flavourRequestsFormArray.markAsDirty();
        }
    }

    private _updateFlavourLimits(): void {
        this._bookingFlavourLimits = this._flavours.map(flavour => {
            const config = this._bookingConfig.flavourConfiguration.find(config => config.flavour.id === flavour.id);
            const flavourAvailabilitiesFuture = this._flavourAvailabilitiesFutures.find(availabilities => availabilities.flavour.id === flavour.id);
            const availabilities = flavourAvailabilitiesFuture == null ? [] : flavourAvailabilitiesFuture.availabilities;
            let {maxInstances, maxDaysInAdvance, maxReservationDays} = config;
            maxInstances = availabilities.reduce((acc: number, curr: FlavourAvailability) => {
                return acc == null ? curr.availableUnits : Math.min(acc, curr.availableUnits);
            }, maxInstances);

            let available = true;
            let message = null;
            if (!this.datesValid) {
                message = 'Selected dates are invalid';
                available = false;
            } else if (maxInstances == null) {
                message = 'Unable to determine availability of flavour';
                available = false;
            } else if (maxInstances === 0) {
                message = 'Flavour unavailable for chosen dates';
                available = false;
            } else if (maxDaysInAdvance != null && this.reservationDaysInAdvance > maxDaysInAdvance) {
                message = `Reservation must be less than ${maxDaysInAdvance + 1}  days in advance`;
                available = false;
            } else if (maxReservationDays != null && this.reservationDurationDays > maxReservationDays) {
                message = `Reservation period must less than ${maxReservationDays + 1} days`;
                available = false;
            }

            if (!available && this.isFlavourSelected(flavour)) {
                this._unselectFlavour(flavour);
            }

            return {flavour, maxInstances, maxDaysInAdvance, maxReservationDays, available, message};
        });

        this._revalidateForm(this._form);
    }

    private _revalidateForm(control: AbstractControl): void {
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
        control.markAsTouched({ onlySelf: true });

        if (control instanceof FormGroup) {
            Object.values(control.controls).forEach(c => this._revalidateForm(c));
        }

        if (control instanceof FormArray) {
            control.controls.forEach(c => this._revalidateForm(c));
        }
    }

}
