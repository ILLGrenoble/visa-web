import {Component, OnInit} from '@angular/core';
import {BookingRequest, BookingService, BookingToken, Flavour} from "../../../core";
import {forkJoin, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {ActivatedRoute, Router} from "@angular/router";
import {NotifierService} from "angular-notifier";
import {Title} from "@angular/platform-browser";
import {AbstractControl, FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {error} from "@angular/compiler-cli/src/transformers/util";

type BookingTokenContainer = {
    token: BookingToken;
    form: FormGroup;
};

type BookingFlavourTokensContainer = {
    flavour: Flavour;
    tokens: BookingTokenContainer[];
};

@Component({
    selector: 'visa-booking-details',
    templateUrl: './booking-details.component.html',
    styleUrls: ['./booking-details.component.scss'],
})
export class BookingDetailsComponent implements OnInit {

    private _loading = false;
    private _booking: BookingRequest;
    private _flavourTokens: BookingFlavourTokensContainer[];
    private _error: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _showDeleteModal = false;
    private _sendingDeleteRequest = false;

    private _form: FormGroup = new FormGroup({
        tokens: this._formBuilder.array([]),
    });

    get loading(): boolean {
        return this._loading;
    }

    get booking(): BookingRequest {
        return this._booking;
    }

    get flavourTokens(): BookingFlavourTokensContainer[] {
        return this._flavourTokens;
    }

    get error(): string {
        return this._error;
    }

    get showDeleteModal(): boolean {
        return this._showDeleteModal;
    }

    get sendingDeleteRequest(): boolean {
        return this._sendingDeleteRequest;
    }

    get bookingActive(): boolean {
        const now = Date.now();
        return now > this._booking.startDate.getTime() && now < this._booking.endDate.getTime();
    }

    get tokensFormArray(): FormArray {
        return this._form.get('tokens') as FormArray;
    }

    get form(): FormGroup {
        return this._form;
    }

    constructor(private _route: ActivatedRoute,
                private _notifierService: NotifierService,
                private _router: Router,
                private _bookingService: BookingService,
                private _formBuilder: FormBuilder,
                private _titleService: Title) {
    }

    ngOnInit() {
        this._titleService.setTitle(`Booking details | VISA`);
        const uid = this._route.snapshot.paramMap.get('uid');

        this._loading = true;

        forkJoin({
                booking: this._bookingService.getBookingRequest(uid),
                tokens: this._bookingService.getBookingRequestTokens(uid),
            }).pipe(takeUntil(this._destroy$))
            .subscribe({
                next: ({booking, tokens}) => {
                    this._loading = false;
                    this._booking = booking;
                    this._buildFlavourTokens(tokens);
                    this._titleService.setTitle(`Booking details (${booking.name}) | VISA`);
                },
                error: (error) => {
                    this._loading = false;
                    if (error.status === 404) {
                        this._error = 'The requested reservation request does not exist';

                    } else {
                        this._error = 'Failed to obtain the reservation request';
                    }
                }
            })
    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    protected deleteBookingRequest(): void {
        this._showDeleteModal = true;
    }

    protected confirmDeleteRequest(): void {
        this._sendingDeleteRequest = true;
        this._bookingService.deleteBookingRequest(this._booking.uid)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: () => {
                    this._sendingDeleteRequest = false;
                    this._notifierService.notify('success', 'The instance reservation has been deleted');
                    this._router.navigate(['bookings'], {replaceUrl: true});
                },
            })
    }

    protected closeDeleteModal(): void {
        this._showDeleteModal = false;
    }

    protected submitTokens(): void {
        const tokenForms = this._form.value.tokens;
        const tokenInputs = tokenForms.map(tokenForm => {
            const {id, owner} = tokenForm;
            return {id, ownerId: owner ? owner.id : null}
        });

        this._bookingService.updateBookingRequestTokens(this.booking.uid, tokenInputs).subscribe((tokens) => {
            this._notifierService.notify('success', 'Tokens successfully updated');
            this._form.markAsPristine();
            this._buildFlavourTokens(tokens);
        });
    }

    private _buildFlavourTokens(allTokens: BookingToken[]): void {
        this.tokensFormArray.clear();

        const flavours = this._booking.flavours.map(flavour => flavour.flavour);
        this._flavourTokens = flavours.map(flavour => {
            const tokens = allTokens
                .filter(token => token.flavour.id === flavour.id)
                .map(token => {
                    const formGroup = this._addTokenFormGroup(token);
                    return {
                        token,
                        form: formGroup
                    }
                });

            return {flavour, tokens}
        });
    }

    private _addTokenFormGroup(token: BookingToken): FormGroup {
        const tokenFormGroup = this._formBuilder.group({
            id: [token.id],
            owner: [token.owner],
        });

        tokenFormGroup.get('owner').valueChanges.subscribe((user) => {
            if (user == null && token.owner != null) {
                this._form.markAsDirty();
            } else if (user != null && token.owner == null) {
                this._form.markAsDirty();
            } else if (token.owner != null && user.id != token.owner.id) {
                this._form.markAsDirty();
            }
        });

        this.tokensFormArray.push(tokenFormGroup);
        return tokenFormGroup;
    }

}
