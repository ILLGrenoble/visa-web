import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SystemNotification} from "@core";
import {filter} from "rxjs/operators";

@Component({
    selector: 'visa-user-notification-dialog',
    templateUrl: 'user-notification.component.html',
})
export class UserNotificationDialog implements OnInit {

    public notification: SystemNotification;

    public onAck$: EventEmitter<any> = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<UserNotificationDialog>,
                @Inject(MAT_DIALOG_DATA) public data: { notification: SystemNotification }) {
        this.notification = data.notification;

        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.handleClose());
        this.dialogRef.backdropClick().subscribe(() => this.handleClose());
    }

    public ngOnInit(): void {
    }

    public submit(): void {
        this.onAck$.emit(true);
        this.handleClose();
        // this.accountService.requestInstanceLifetimeExtension(this.instance, comments)
        //     .subscribe((data) => {
        //         this.dialogRef.close(data);
        //     });
    }

    public handleClose(): void {
        this.dialogRef.close();
    }
}
