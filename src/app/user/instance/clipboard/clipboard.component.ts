import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {ReplaySubject, Subject, timer} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {VirtualDesktopManager} from '@vdi';
import {CodemirrorComponent} from "@ctrl/ngx-codemirror";

@Component({
    selector: 'visa-instance-clipboard-dialog',
    templateUrl: './clipboard.component.html',
    styleUrls: ['./clipboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ClipboardComponent implements OnInit, OnDestroy, AfterViewInit {

    private _text = '';
    private _clipboardSubscription$: ReplaySubject<{ content: string, event: string }>;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _manager: VirtualDesktopManager;
    private _documentListener: () => void;

    private _showModal$: Subject<boolean>;
    private _showModal: boolean = false;
    private _onClosed$: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('codeMirror')
    private _codeEditorCmp: CodemirrorComponent;

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
    }

    get manager(): VirtualDesktopManager {
        return this._manager;
    }

    get showModal(): boolean {
        return this._showModal;
    }

    set showModal(value: boolean) {
        this._showModal = value;
        if (!value) {
            this._onClosed$.next(null);
        }
    }

    @Input()
    set showModal$(value: Subject<boolean>) {
        this._showModal$ = value;
    }

    @Input()
    set manager(value: VirtualDesktopManager) {
        this._manager = value;
        if (this._manager) {
            this._clipboardSubscription$ = this._manager.onRemoteClipboardData;
            this._clipboardSubscription$.pipe(
                takeUntil(this._destroy$),
            ).subscribe((text) => this._text = text.content);
        }
    }

    @Output()
    get onClosed(): EventEmitter<string> {
        return this._onClosed$;
    }

    constructor() {
    }

    private handleOnKeydown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'Enter') {
            this.sendClipboardText();
        }
    }

    public sendClipboardText(): void {
        this._onClosed$.next(this._text);
        this._showModal = false;
    }

    public ngOnInit(): void {
        this._showModal$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(showModal => {
            this._showModal = showModal;
        });

        timer(1, 100)
            .pipe(
                takeUntil(this.destroy$),
            )
            .subscribe(() => {
                this._codeEditorCmp.codeMirror?.refresh();
            });
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

    public ngAfterViewInit(): void {
        this._codeEditorCmp.codeMirrorLoaded.subscribe(codeMirrorComponent => {
            const inputField = codeMirrorComponent.codeMirror.getInputField();
            inputField.focus();
            inputField.addEventListener('keydown', this.handleOnKeydown.bind(this));
        });
        this._codeEditorCmp.autoFocus = true;
    }


}
