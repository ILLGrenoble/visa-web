import {AfterContentInit, ChangeDetectorRef, Component, ContentChild, Input, OnChanges, OnDestroy} from '@angular/core';
import {TabActionsComponent} from './tab-actions.component';
import {TabContentComponent} from './tab-content.component';
import {TabTitleIconComponent} from './tab-title-icon.component';
import {TabTitleComponent} from './tab-title.component';

@Component({
    selector: 'visa-tab',
    template: `
        <ng-container>
        </ng-container>
    `,
})
export class TabComponent implements OnChanges, AfterContentInit {
    @Input() public name: string;

    @ContentChild(TabTitleComponent)
    public title: TabTitleComponent;

    @ContentChild(TabTitleIconComponent)
    public icon: TabTitleIconComponent;

    @ContentChild(TabContentComponent)
    public content: TabContentComponent;

    @ContentChild(TabActionsComponent)
    public actions: TabActionsComponent;

    constructor(private changeDetectorRef: ChangeDetectorRef) {
        this.changeDetectorRef.detach();
    }

    public ngOnChanges(): void {
        this.changeDetectorRef.detectChanges();
    }

    public ngAfterContentInit(): void {
        this.changeDetectorRef.detectChanges();
    }
}
