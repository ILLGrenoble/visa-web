import {AfterViewInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Subject} from 'rxjs';

@Component({
    selector: 'visa-file-manager-dialog',
    templateUrl: './file-manager.component.html'
})
export class FileManagerComponent implements OnInit, OnDestroy, AfterViewInit {

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    constructor(private dialogRef: MatDialogRef<FileManagerComponent>,
                @Inject(MAT_DIALOG_DATA) private data: {  }) {
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
    }

    public ngAfterViewInit(): void {
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }
}
