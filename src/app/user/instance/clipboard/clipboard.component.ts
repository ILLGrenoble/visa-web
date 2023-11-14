import {AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject, ReplaySubject, Subject, timer} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {VirtualDesktopManager} from '@vdi';
import {CodemirrorComponent} from "@ctrl/ngx-codemirror";

@Component({
    selector: 'visa-instance-clipboard-dialog',
    templateUrl: './clipboard.component.html'
})
export class ClipboardComponent implements OnInit, OnDestroy, AfterViewInit {

    private _text = '';
    private _clipboardSubscription$: ReplaySubject<{ content: string, event: string }>;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _manager: VirtualDesktopManager;
    private _documentListener: () => void;
    private _clipboardSynchronisationEnabled$ = new BehaviorSubject<boolean>(true);

    @ViewChild('codeMirror')
    private _codeEditorCmp: CodemirrorComponent;

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get clipboardSynchronisationEnabled$(): BehaviorSubject<boolean> {
        return this._clipboardSynchronisationEnabled$;
    }

    set clipboardSynchronisationEnabled$(value: BehaviorSubject<boolean>) {
        this._clipboardSynchronisationEnabled$ = value;
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
    }

    get clipboardSubscription$(): ReplaySubject<{ content: string; event: string }> {
        return this._clipboardSubscription$;
    }

    set clipboardSubscription$(value: ReplaySubject<{ content: string; event: string }>) {
        this._clipboardSubscription$ = value;
    }

    get manager(): VirtualDesktopManager {
        return this._manager;
    }

    set manager(value: VirtualDesktopManager) {
        this._manager = value;
    }

    get documentListener(): () => void {
        return this._documentListener;
    }

    set documentListener(value: () => void) {
        this._documentListener = value;
    }

    get codeEditorCmp(): CodemirrorComponent {
        return this._codeEditorCmp;
    }

    set codeEditorCmp(value: CodemirrorComponent) {
        this._codeEditorCmp = value;
    }

    constructor(private dialogRef: MatDialogRef<ClipboardComponent>,
                @Inject(MAT_DIALOG_DATA) private data: { manager: VirtualDesktopManager }) {
        this._manager = data.manager;
        this._clipboardSubscription$ = this._manager.onRemoteClipboardData;
        this._clipboardSubscription$.pipe(takeUntil(this._destroy$)).subscribe((text) => this._text = text.content);
    }

    private handleOnKeydown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'Enter') {
            this.dialogRef.close(this._text);
        }
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
        if (this._documentListener) {
            this._documentListener();
        }
        const inputField = this._codeEditorCmp.codeMirror.getInputField();
        inputField.removeEventListener('keydown', this.handleOnKeydown.bind(this));
    }

    public ngOnInit(): void {
        timer(1, 100)
            .pipe(
                takeUntil(this.destroy$),
            )
            .subscribe(() => {
                this._codeEditorCmp.codeMirror.refresh();
            });

        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }

    public ngAfterViewInit(): void {
        const inputField = this._codeEditorCmp.codeMirror.getInputField();
        inputField.focus();
        inputField.addEventListener('keydown', this.handleOnKeydown.bind(this));
        this._codeEditorCmp.autoFocus = true;
    }


}
