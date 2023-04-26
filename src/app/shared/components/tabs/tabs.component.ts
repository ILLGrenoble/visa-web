import {
    AfterContentInit, AfterViewInit,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    EventEmitter,
    Input,
    Output,
    QueryList,
    ViewEncapsulation
} from '@angular/core';

import {TabComponent} from './tab.component';

@Component({
    selector: 'visa-tabs',
    template: `
        <div class="visa-tabs">
            <ul class="visa-tabs-body">
                <li *ngFor="let tab of tabs" (click)="selectTab(tab)" class="visa-tab" [class.visa-tab--selected]="tab === activeTab">
                    <span class="visa-tab-title-icon" *ngIf="tab.icon">
                        <ng-container class="visa-tab-title-icon" *ngTemplateOutlet="tab.icon.content">
                        </ng-container>
                    </span>
                    <span>
                        <ng-container *ngTemplateOutlet="tab.title.content">
                        </ng-container>
                    </span>
                </li>
            </ul>
            <div class="visa-tabs-actions" *ngIf="activeTab.actions">
                <ng-container *ngTemplateOutlet="activeTab.actions.content">
                </ng-container>
            </div>
        </div>
        <ng-container *ngIf="activeTab.content">
            <ng-container *ngTemplateOutlet="activeTab.content.content">
            </ng-container>
        </ng-container>
    `,
    styleUrls: ['./tabs.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class TabsComponent implements AfterContentInit, AfterViewInit {

    private _selected: string;
    private _activeTab: TabComponent;

    public get selected(): string {
        return this._selected;
    }

    @Input()
    public set selected(value: string) {
        this._selected = value;
        this.setActiveTab();
    }

    @Output()
    public selectedChange = new EventEmitter<string>();

    constructor(private cdr: ChangeDetectorRef) {
    }

    public get activeTab(): TabComponent {
        return this._activeTab;
    }

    public set activeTab(value: TabComponent) {
        this._activeTab = value;
    }

    @ContentChildren(TabComponent) public tabs: QueryList<TabComponent>;

    public ngAfterContentInit(): void {
        this.setActiveTab();
    }

    public selectTab(tab: TabComponent): void {
        this._activeTab = tab;
        this._selected = tab.name;
        this.selectedChange.emit(this._selected);
    }

    private setActiveTab(): void {
        if (this.tabs) {
            if (this._selected == null) {
                this.activeTab = this.tabs.first;

            } else {
                const selectedTab = this.tabs.find((tab) => tab.name === this._selected);
                if (selectedTab == null) {
                    this.activeTab = this.tabs.first;
                } else {
                    this.activeTab = selectedTab;
                }
            }
        }
    }

    ngAfterViewInit(): void {
        this.cdr.detectChanges();
    }


}
