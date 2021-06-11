import {Component, ElementRef, HostListener, Input, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'visa-dropdown-menu',
    template: `
        <div class="visa-dropdown">
            <button class="{{toggleClass}}" (click)="onToggle()">
                <ng-content select="visa-dropdown-menu-button"></ng-content>
            </button>
            <div class="visa-dropdown-menu" *ngIf="isOpen">
                <ul class="visa-dropdown-list" (click)="onClick()">
                    <ng-content select="visa-dropdown-menu-item"></ng-content>
                </ul>
            </div>
        </div>
    `,
    styleUrls: ['./dropdown-menu.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class DropdownMenuComponent {

    private _isOpen = false;

    private _toggleClass: string;

    get toggleClass(): string {
        if (this._toggleClass == null) {
            return 'visa-dropdown-toggle';
        }
        return this._toggleClass;
    }

    @Input()
    set toggleClass(value: string) {
        this._toggleClass = value;
    }

    public get isOpen(): boolean {
        return this._isOpen;
    }

    public set isOpen(isOpen: boolean) {
        this._isOpen = isOpen;
    }

    @HostListener('document:click', ['$event'])
    public clickout(event): void {
        // did the click happen outside of the host element?
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    constructor(private elRef: ElementRef) {
    }

    public onClick(): void {
        this.isOpen = false;
    }

    public onToggle(): void {
        this.isOpen = !this.isOpen;
    }
}
