import {AfterViewInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Subject} from 'rxjs';
import {NgxFileSysContext} from "@illgrenoble/ngx-fs-client";
import {filter} from "rxjs/operators";

@Component({
    selector: 'visa-file-manager-dialog',
    templateUrl: './file-manager.component.html',
    styleUrls: ['./file-manager.component.scss'],
})
export class FileManagerComponent implements OnInit, OnDestroy, AfterViewInit {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _context: NgxFileSysContext;

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get context(): NgxFileSysContext {
        return this._context;
    }

    constructor(private dialogRef: MatDialogRef<FileManagerComponent>,
                @Inject(MAT_DIALOG_DATA) data: { context: NgxFileSysContext }) {
        this._context = data.context;
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }

    public ngAfterViewInit(): void {
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }
}
