import {Component, EventEmitter, HostListener, Input, Output, ViewEncapsulation} from "@angular/core";

@Component({
    selector: 'visa-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ModalComponent {

    private _draggable: boolean = false;
    private _backdrop: boolean = true;
    private _closeable: boolean = true;
    private _modalOpen: boolean = false;
    private _width: string = '700px';
    private _modalOpenChange$: EventEmitter<boolean> = new EventEmitter<boolean>();

    get draggable(): boolean {
        return this._draggable;
    }

    @Input()
    set draggable(value: boolean) {
        this._draggable = value;
    }

    get backdrop(): boolean {
        return this._backdrop;
    }

    @Input()
    set backdrop(value: boolean) {
        this._backdrop = value;
    }

    get closeable(): boolean {
        return this._closeable;
    }

    @Input()
    set closeable(value: boolean) {
        this._closeable = value;
    }

    get modalOpen(): boolean {
        return this._modalOpen;
    }

    @Input()
    set modalOpen(value: boolean) {
        this._modalOpen = value;
    }

    @Output()
    get modalOpenChange(): EventEmitter<boolean> {
        return this._modalOpenChange$;
    }

    get width(): string {
        return this._width;
    }

    @Input()
    set width(value: string) {
        this._width = value;
    }

    onBackdropClicked(): void {
        if (this._backdrop && this._closeable && this._modalOpen) {
            this._modalOpen = false;
            this._modalOpenChange$.emit(false);
        }
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscape(event: KeyboardEvent): void {
        this.onBackdropClicked();
    }
}
