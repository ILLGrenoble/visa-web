import {ReplaySubject, Subject} from "rxjs";
import {VirtualDesktopManager} from "./virtual-desktop-manager.service";
import {takeUntil} from "rxjs/operators";

export class ClipboardService {

    private _canUseClipboard: boolean = true;
    private _clipboardContent: string = null;
    private _manager: VirtualDesktopManager

    private _clipboardSubscription$: ReplaySubject<{ content: string, event: string }>;

    constructor() {
    }

    public start(manager: VirtualDesktopManager): void {
        if (this._manager == null) {
            this._manager = manager;

            this._clipboardSubscription$ = this._manager.onRemoteClipboardData;
            this._clipboardSubscription$.subscribe(this.onClipboardData);

            this._startClipboardReadTimer();
        }
    }

    public stop(): void {
        if (this._manager) {
            this._clipboardSubscription$.unsubscribe();
            this._canUseClipboard = false;
            this._manager = null;
        }
    }

    private onClipboardData(data: { content: string, event: string }): void {
        if (data.event == 'received') {
            if (document.hasFocus()) {
                navigator.clipboard.writeText(data.content)
                    .catch(error => {
                        console.log(`Failed to write to local clipboard: ${error.message}: local clipboard disabled`);
                        // Failed to write to local clipboard
                        this._canUseClipboard = false;
                    });
            }
            this._clipboardContent = data.content;
        }
    }

    private _startClipboardReadTimer(): void {
        if (this._canUseClipboard) {
            setTimeout(() => this._readClipboard(), 1000);
        }
    }

    private _readClipboard(): void {
        if (document.hasFocus()) {
            navigator.clipboard.readText()
                .then(clipboardContent => {
                    if (this._canUseClipboard) {
                        if (this._clipboardContent != clipboardContent) {
                            this._clipboardContent = clipboardContent;
                            this._manager.sendRemoteClipboardData(clipboardContent);
                        }

                        this._startClipboardReadTimer();
                    }

                })
                .catch((error) => {
                    console.log(`Failed to read from local clipboard: ${error.message}: local clipboard disabled`);
                    // Failed to read local clipboard
                    this._canUseClipboard = false;
                });

        } else {
            this._startClipboardReadTimer();
        }
    }

}
