import {Component, Input, OnInit} from '@angular/core';
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
    ApplicationState, BookingFlavourConfiguration, BookingFlavourRequestInput, BookingRequest,
    BookingRequestInput,
    BookingService,
    BookingUserConfiguration,
    Flavour, FlavourAvailabilitiesFuture, FlavourAvailability,
    selectUserBookingConfiguration
} from "../../../core";
import {
    combineLatestWith,
    distinctUntilChanged,
    filter,
    map,
    switchMap,
    take,
    takeUntil,
} from "rxjs/operators";
import {Store} from "@ngrx/store";
import {NotifierService} from "angular-notifier";
import {ActivatedRoute, Router} from "@angular/router";
import {BehaviorSubject, config, forkJoin, of, Subject} from "rxjs";
import {Title} from "@angular/platform-browser";

const toDateString = (date: Date): string => {
    if (date == null) {
        return null;
    }
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
}

const toFormDateString = (date: Date): string => {
    if (date == null) {
        return null;
    }
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
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
        uid: new FormControl(null),
        startDate: new FormControl(null, Validators.required),
        endDate: new FormControl(null, Validators.required),
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

    private _showSubmitModal = false;
    private _sendingRequest = false;
    private _requestErrors: string[] = null;
    private _originalName: string;

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

    get originalName(): string {
        return this._originalName;
    }

    constructor(private _formBuilder: FormBuilder,
                private _store: Store<ApplicationState>,
                private _notifierService: NotifierService,
                private _route: ActivatedRoute,
                private _router: Router,
                private _bookingService: BookingService,
                private _titleService: Title) {
    }

    ngOnInit(): void {
        forkJoin({
            bookingRequest: this._route.params.pipe(
                take(1),
                map(params => params['uid'] as string),
                switchMap(uid => {
                    return uid == null ? of(null) : this._bookingService.getBookingRequest(uid);
                })
            ),
            bookingConfig: this._store.select(selectUserBookingConfiguration).pipe(
                filter(bookingConfig => !!bookingConfig),
                take(1)
            )
        }).subscribe(({bookingRequest, bookingConfig}) => {
            if (bookingRequest == null) {
                this._titleService.setTitle(`New booking | VISA`);
            } else {
                this._titleService.setTitle(`Modify booking | VISA`);
                this._originalName = bookingRequest.name;
            }
            this._createForm(bookingRequest);

            this._bookingConfig = bookingConfig;
            this._flavours = bookingConfig.flavourConfiguration.map(config => config.flavour).sort((f1: Flavour, f2: Flavour) => {
                if (f1.cpu > f2.cpu) return 1;
                if (f1.cpu < f2.cpu) return -1;
                return f1.memory - f2.memory;
            });

            this._calculateFlavourAvailabilities();

            this._startDate.pipe(
                combineLatestWith(this._endDate),
                takeUntil(this._destroy$),
            ).subscribe(([startDate, endDate]) => {
                this._calculateFlavourAvailabilities();
            });
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
            this._calculateFlavourAvailabilities();
        }
    }

    protected isFlavourSelected(flavour: Flavour): boolean {
        const {flavourRequests} = this._form.value;
        return flavourRequests.find(flavourRequest => flavourRequest.flavour.id === flavour.id);
    }

    protected createOrUpdateBookingRequest(): void {
        this._showSubmitModal = true;
        this._sendingRequest = true;
        this._requestErrors = null;

        const {uid, name, comments, flavourRequests} = this._form.value;

        const flavourRequestInputs = flavourRequests.map(flavourRequest => {
            const {flavour, quantity} = flavourRequest;
            return {flavourId: flavour.id, quantity};
        });

        const input: BookingRequestInput = {
            uid,
            startDate: toDateString(this.startDate),
            endDate: toDateString(this.endDate),
            name,
            comments,
            flavourRequests: flavourRequestInputs,
        }

        this._bookingService.createOrUpdateBookingRequest(input).subscribe({
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

    private _createForm(booking?: BookingRequest): void {
        if (booking) {
            const startDate = booking.startDate;
            const endDate = booking.endDate;
            const name = booking.name;
            const flavours = booking.flavours;
            this._startDate.next(new Date(startDate));
            this._endDate.next(new Date(endDate));

            this.form.reset({
                uid: booking.uid,
                startDate: toFormDateString(startDate),
                endDate: toFormDateString(endDate),
                name
            });

            flavours.map((flavourRequest) => {
                return this._createFlavourRequestFormGroup(flavourRequest.flavour, flavourRequest.quantity);
            }).forEach(flavourGroup => {
                this.flavourRequestsFormArray.push(flavourGroup);
            })
            this._sortFlavourForms();
        }
    }

    private _createFlavourRequestFormGroup(flavour: Flavour, quantity?: number): FormGroup {
        const formGroup = this._formBuilder.group({
            flavour: [flavour, [Validators.required]],
            quantity: [quantity, [Validators.required, (control: AbstractControl) => this._flavourQuantityValidator(flavour, control.value)]],
        });

        // Add listener to quantity change to update the availabilities
        formGroup.get('quantity').valueChanges.pipe(
            filter(value => !!value),
            distinctUntilChanged(),
        ).subscribe((value) => {
            this._calculateFlavourAvailabilities();
        })

        return formGroup;
    }

    private _flavourQuantityValidator(flavour: Flavour, quantity: number): ValidationErrors | null {
        const limits = this._bookingFlavourLimits.find(limit => limit.flavour.id === flavour.id);
        return quantity > limits?.maxInstances ? {limitExceeded: true} : null;
    }

    private _selectFlavour(flavour: Flavour): void {
        const flavourGroup = this._createFlavourRequestFormGroup(flavour);
        this.flavourRequestsFormArray.push(flavourGroup);
        this._sortFlavourForms();
    }

    private _sortFlavourForms(): void {
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

    private _calculateFlavourAvailabilities(): void {
        const {uid, name, comments, flavourRequests} = this._form.value;
        const formArray = this.flavourRequestsFormArray;

        const flavourRequestInputs = formArray.controls.map((control: AbstractControl) => {
            const group = control as FormGroup;
            return {
                flavourId: group.get('flavour')?.value.id,
                quantity: group.get('quantity')?.value
            };
        });

        const input: BookingRequestInput = {
            uid,
            startDate: toDateString(this.startDate == null ? new Date() : this.startDate),
            endDate: toDateString(this.endDate == null ? new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000) : this.endDate),
            name: name ? name : 'temporary booking request',
            comments : comments ? comments : 'work in progress',
            flavourRequests: flavourRequestInputs,
        }

        this._bookingService.calculateFlavourAvailabilities(input).subscribe((flavourAvailabilitiesFutures) => {
            const bookingFlavourUsage = flavourRequestInputs.reduce((acc: any, curr: BookingFlavourRequestInput) => {
                acc[curr.flavourId] = curr.quantity;
                return acc;
            }, {})

            // Add the current usage onto the availabilities to keep the limits coherent
            flavourAvailabilitiesFutures.forEach(flavourAvailabilitiesFuture => {
                flavourAvailabilitiesFuture.availabilities.forEach(availability => {
                    const modifier = bookingFlavourUsage[flavourAvailabilitiesFuture.flavour.id] || 0;
                    availability.availableUnits += modifier;
                });
            });
            this._flavourAvailabilitiesFutures = flavourAvailabilitiesFutures;
            this._updateFlavourLimits();
        })

    }

    private _updateFlavourLimits(): void {
        this._bookingFlavourLimits = this._flavours.map(flavour => {
            const config = this._bookingConfig.flavourConfiguration.find(config => config.flavour.id === flavour.id);
            const flavourAvailabilitiesFuture = this._flavourAvailabilitiesFutures.find(availabilities => availabilities.flavour.id === flavour.id);
            const availabilities = flavourAvailabilitiesFuture == null ? [] : flavourAvailabilitiesFuture.availabilities;
            let {maxInstances, maxReservationDays} = config;
            maxInstances = availabilities.reduce((acc: number, curr: FlavourAvailability) => {
                return acc == null ? curr.availableUnits : Math.min(acc, curr.availableUnits);
            }, maxInstances);

            let available = true;
            let message = null;
            if (!this.datesValid) {
                available = false;
            } else if (maxInstances == null) {
                message = 'Unable to determine availability of flavour';
                available = false;
            } else if (maxInstances === 0) {
                message = 'Flavour unavailable for chosen dates';
                available = false;
            } else if (maxReservationDays != null && this.reservationDurationDays > maxReservationDays) {
                message = `Reservation period must be less than ${maxReservationDays + 1} days`;
                available = false;
            }

            if (!available && this.isFlavourSelected(flavour)) {
                this._unselectFlavour(flavour);
            }

            return {flavour, maxInstances, maxReservationDays, available, message};
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
