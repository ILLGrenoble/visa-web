import {
    Component,
    ElementRef, EventEmitter,
    Input,
    OnInit, Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {Subject} from "rxjs";


export type ToolbarSelectOption<T> = {
    value: T;
    label: string;
    selected?: boolean;
    hidden?: boolean;
}

/**
 * Toolbar select inside the toolbar
 */
@Component({
    selector: 'ngx-remote-desktop-toolbar-select',
    template: `
        <div class="ngx-remote-desktop-toolbar-select">
            <div #select class="ngx-remote-desktop-toolbar-select__main">
                <div class="ngx-remote-desktop-toolbar-select__selected" (click)="toggleOptions($event)">
                    <div #selectedelement class="ngx-remote-desktop-toolbar-select__selected__label">
                        {{selected?.label}}
                    </div>
                    <img [hidden]="optionsVisible" class="ngx-remote-desktop-toolbar-select__open-close" src="assets/images/caret-down.svg" height="12">
                    <img [hidden]="!optionsVisible" class="ngx-remote-desktop-toolbar-select__open-close" src="assets/images/caret-up.svg" height="12">
                </div>
                <div #optionselement class="ngx-remote-desktop-toolbar-select__options"
                     [ngClass]="{'ngx-remote-desktop-toolbar-select__options__opened': optionsVisible, 'ngx-remote-desktop-toolbar-select__options__closed': !optionsVisible}">
                    <div *ngFor="let option of options;" class="ngx-remote-desktop-toolbar-select__option" (click)="onSelect($event, option)">
                        <div *ngIf="option.selected">
                            <b>{{option.label}}</b>
                        </div>
                        <div *ngIf="!option.selected">
                            {{option.label}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ToolbarSelectComponent {

    private _options: ToolbarSelectOption<any>[] = [];
    private _selected: ToolbarSelectOption<any>;
    protected optionsVisible = false;
    private _onSelect$ = new EventEmitter<any>();

    @ViewChild('select')
    private _selectElement: ElementRef;

    @Input()
    public set options(value: ToolbarSelectOption<any>[]) {
        this._options = value == null ? null : value.filter(option => !option.hidden);
        this._selected = value == null ? null : value.find(option => option.selected);
    }

    @Output('onSelect')
    get onSelect$(): EventEmitter<any> {
        return this._onSelect$;
    }

    get options(): ToolbarSelectOption<any>[] {
        return this._options;
    }

    get selected(): ToolbarSelectOption<any> {
        return this._selected;
    }

    constructor(private _renderer: Renderer2) {
        this._renderer.listen('window', 'click',(e:Event)=>{
            if (this.optionsVisible && !this._selectElement.nativeElement.contains(e.target)) {
                this.optionsVisible = false;
            }
        });
    }

    protected toggleOptions(event: MouseEvent): void {
        this.optionsVisible = !this.optionsVisible;
    }

    protected onSelect(event: MouseEvent, option: ToolbarSelectOption<any>): void {
        this.optionsVisible = false;
        if (option != this._selected) {
            this._selected.selected = false;
            this._selected = option;
            option.selected = true;
            this._onSelect$.next(option.value);
        }
    }
}
