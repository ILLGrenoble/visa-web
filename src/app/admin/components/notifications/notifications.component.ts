import {Component, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ClrForm} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {SystemNotification} from '../../../core/graphql/types';

@Component({
    selector: 'visa-admin-notifications',
    styleUrls: ['./notifications.component.scss'],
    templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
    @ViewChild(ClrForm) public clrForm;

    public notifications: SystemNotification[];

    public notificationTable = new FormGroup({
        tableRows: new FormArray([]),
    });

    public tableRows = this.notificationTable.get('tableRows') as FormArray;

    constructor(private apollo: Apollo, private snackBar: MatSnackBar) {
    }

    public ngOnInit(): void {
        this.fetch().then((notifications) => {
                this.notifications = notifications;
                this.initFormTable();
            },
        );
    }

    public initFormTable(): void {
        while (this.tableRows.length) {
            this.tableRows.removeAt(0);
        }
        this.notifications.forEach((notification) => {
            this.tableRows.push(new FormGroup({
                id: new FormControl(notification.id),
                level: new FormControl(notification.level, Validators.required),
                message: new FormControl(notification.message, Validators.required),
            }));
        });
    }

    public addRow(): void {
        this.tableRows.push(new FormGroup({
            id: new FormControl(''),
            level: new FormControl('', Validators.required),
            message: new FormControl('', Validators.required),
        }));
    }

   public onCreate(notificationController: AbstractControl): void {
        if (notificationController.invalid) {
            notificationController.markAsDirty();
        } else {
            const inputNotification = {
                level: notificationController.get('level').value,
                message: notificationController.get('message').value,
            };
            this.create(inputNotification).then(
                () => {
                    this.notificationSnackBar('Created Notification message');
                    this.fetch().then((notifications) => {
                        this.notifications = notifications;
                        this.initFormTable();
                    });
                });
        }

    }

    public onDelete(notificationController: AbstractControl, index: number): void {
        if (notificationController.get('id').value) {
            const id = notificationController.get('id').value;
            this.delete(id).then(
                () => {
                    this.notificationSnackBar('Deleted Notification message');
                    this.fetch().then((notifications) => {
                        this.notifications = notifications;
                        this.tableRows.removeAt(index);
                    });
                },
            );
        } else {
            this.tableRows.removeAt(index);
        }
    }

    public notificationChange(notificationController: AbstractControl, index: number): boolean {
        if (notificationController.get('id').value) {
            return notificationController.get('message').value !== this.notifications[index].message ||
                notificationController.get('level').value !== this.notifications[index].level;
        } else  {
            return !notificationController.invalid;
        }
    }

    public isUpdate(notificationController: AbstractControl): void {
        if (notificationController.get('id').value) {
            this.onUpdate(notificationController);
        } else {
            this.onCreate(notificationController);
        }
    }

    public onUpdate(notificationController: AbstractControl): void {
        const inputNotification = {
            level: notificationController.get('level').value,
            message: notificationController.get('message').value
        };
        if (notificationController.get('id').value) {
            const id = notificationController.get('id').value;
            this.update(id, inputNotification).then(
                () => {
                    this.notificationSnackBar('Updated Notification message');
                    this.fetch().then((notifications) => {
                        this.notifications = notifications;
                    });
                },
            );
        } else {

        }

    }

    public notificationSnackBar(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 2000,
        });
    }

    public fetch(): Promise<SystemNotification[]> {
        return this.apollo.watchQuery<any>({
            query: gql`{
            systemNotifications {
                id
                level
                message
            }
        }`,
        }).result()
            .then(({data}) => {
                return data.systemNotifications;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public create(input): Promise<SystemNotification> {
        return this.apollo.watchQuery<any>({
            query: gql`
            mutation create($input: SystemNotificationInput!) {
                createSystemNotification(input: $input) {
                    id
                    level
                    message
                }
            }`, variables: {input},
        }).result()
            .then(({data}) => {
                return data.createSystemNotification;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public update(id, input): Promise<SystemNotification> {
        return this.apollo.watchQuery<any>({
            query: gql`
            mutation update($id: Int!,$input: SystemNotificationInput!) {
                updateSystemNotification(id: $id,input:$input) {
                    id
                    level
                    message
                }
            }`, variables: {id, input},
        }).result()
            .then(({data}) => {
                return data.updateSystemNotification;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public delete(id): Promise<SystemNotification> {
        return this.apollo.watchQuery<any>({
            query: gql`
              mutation delete($id: Int!) {
                deleteSystemNotification(id: $id) {
                    id
                    level
                    message
                }
               }`, variables: {id},
        }).result()
            .then(({data}) => {
                return data.deleteSystemNotification;
            }).catch((error) => {
                throw new Error(error);
            });
    }
}
