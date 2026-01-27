import {Component, Input, OnInit} from '@angular/core';
import {Subject} from "rxjs";

@Component({
    selector: 'visa-instance-access-request-dialog',
    templateUrl: './access-request.component.html',
})
export class AccessRequestComponent implements OnInit {

    private _userFullName: string;
    private _callback: (response: string) => void;
    private _modalData$: Subject<{userFullName: string, callback: (response: string) => void}>;
    private _requests: {userFullName: string, callback: (response: string) => void}[] = [];
    private _showModal = false;

    get showModal(): boolean {
        return this._showModal;
    }

    set showModal(value: boolean) {
        this._showModal = value;
    }

    @Input()
    set modalData$(value: Subject<{userFullName: string, callback: (response: string) => void}>) {
        this._modalData$ = value;
    }

    get userFullName(): string {
        return this._userFullName;
    }

    constructor() {
    }

    public ngOnInit() {
        this._modalData$.pipe(
        ).subscribe(data => {
            this._requests.push(data);
            this._onRequest();
        });
    }

    public onReject(): void {
        this._callback('NONE');
        this._onResponse();
    }

    public onFullAccess(): void {
        this._callback('SUPPORT');
        this._onResponse();
    }

    public onReadOnlyAccess(): void {
        this._callback('GUEST');
        this._onResponse();
    }

    private _onRequest(): void {
        if (this._requests.length > 0) {
            const data = this._requests[0];
            this._userFullName = data.userFullName;
            this._callback = data.callback;
            this._showModal = true;
        }
    }

    private _onResponse(): void {
        this._requests.shift();
        if (this._requests.length > 0) {
            this._onRequest();

        } else {
            this._showModal = false;
        }
    }

}
