import {Component, Input} from '@angular/core';
import {fromEvent, merge} from 'rxjs';
import {sample} from 'rxjs/operators';

@Component({
    selector: 'visa-dropdown-menu-item',
    template: `
        <li
            class="visa-dropdown-list-item"
            [class.visa-dropdown-list-item--divider]="divider"
        >
      <span class="visa-dropdown-list-item-link" *ngIf="!divider">
        <ng-content></ng-content>
      </span>
        </li>
    `,
})
export class DropdownMenuItemComponent {

    private _divider = false;

    @Input()
    public set divider(divider: boolean) {
        this._divider = divider;
    }

    public get divider(): boolean {
        return this._divider;
    }
}
