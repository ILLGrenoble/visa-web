import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ClarityModule} from '@clr/angular';
import {CodemirrorModule} from '@ctrl/ngx-codemirror';
import {NgSelectModule} from '@ng-select/ng-select';
import {HotkeyModule} from 'angular2-hotkeys';
import {MomentModule} from 'ngx-moment';
import {NgPipesModule} from 'ngx-pipes';

import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {NotifierModule} from 'angular-notifier';
import {MarkdownModule, MarkedOptions, MarkedRenderer} from 'ngx-markdown';
import {
    AccountComponent,
    DropdownMenuButtonComponent,
    DropdownMenuComponent,
    DropdownMenuItemComponent,
    ImageComponent,
    InvalidAccountDialogComponent,
    LoginComponent,
    OwnerSearchComponent,
    SystemNotificationComponent,
    TabActionsComponent,
    TabComponent,
    TabContentComponent,
    TabsComponent,
    TabTitleComponent,
    TabTitleIconComponent,
    NotificationBadgeComponent,
} from './components';
import {AuthenticatedContainerComponent} from './containers';
import {
    FileSizePipe,
    MembershipRoleFilterPipe,
    MembersRoleFilterPipe,
    RandomItemPipe,
    TimeConversionPipe,
    TimeDurationPipe,
    SanitizerPipe,
    InstanceFilterPipe, SafePipe
} from './pipes';
import {MatCommonModule} from '@angular/material/core';

export function markedOptionsFactory(): MarkedOptions {
    const renderer = new MarkedRenderer();

    renderer.image = (href, title, text) => {
        const renderCaption = () => {
            if (text && text.length > 0) {
                return `<figcaption class="md-figcaption">${text}</figcaption>`;
            }
            return '';
        };
        return `
        <figure class="md-figure">
            <span class="md-wrapper">
                <a  href="${href}" style="display: block" target="_blank" rel="noopener">
                    <img class="md-image" alt="${title}" title="${text}" src="${href}"/>
                </a>
            </span>
            ${renderCaption()}
        </figure>
        `;
    };

    renderer.link = (href: string, title: string, text: string) => {
        return `
            <a href="${href}" target="_blank">${text}</a>
        `;
    };

    return {
        renderer,
        gfm: true,
        breaks: false,
        pedantic: false,
        smartLists: true,
        smartypants: false,
    };
}

@NgModule({
    imports: [
        ClarityModule,
        CodemirrorModule,
        CommonModule,
        DragDropModule,
        FormsModule,
        MatCommonModule,
        MatButtonModule,
        MatDialogModule,
        MomentModule,
        NgSelectModule,
        ReactiveFormsModule,
        RouterModule,
        HotkeyModule.forRoot(),
        MarkdownModule.forRoot({
            loader: HttpClient,
            markedOptions: {
                provide: MarkedOptions,
                useFactory: markedOptionsFactory,
            },
        }),
        NgPipesModule,
        NotifierModule.withConfig({
            position: {
                horizontal: {
                    position: 'right',
                    distance: 12,
                }, vertical: {
                    position: 'bottom',
                    distance: 31,
                    gap: 10,
                },
            },
        }),
    ],
    exports: [
        CodemirrorModule,
        CommonModule,
        MembersRoleFilterPipe,
        MembershipRoleFilterPipe,
        RandomItemPipe,
        FileSizePipe,
        SanitizerPipe,
        DropdownMenuComponent,
        DropdownMenuButtonComponent,
        DropdownMenuItemComponent,
        OwnerSearchComponent,
        ReactiveFormsModule,
        TabsComponent,
        TabComponent,
        TabTitleComponent,
        TabActionsComponent,
        TabContentComponent,
        TabTitleIconComponent,
        TimeDurationPipe,
        TimeConversionPipe,
        SafePipe,
        ImageComponent,
        FormsModule,
        NgSelectModule,
        MatCommonModule,
        MomentModule,
        MarkdownModule,
        ClarityModule,
        DragDropModule,
        MatDialogModule,
        MatButtonModule,
        NgPipesModule,
        RouterModule,
        SanitizerPipe,
        InstanceFilterPipe,
        NotificationBadgeComponent,
    ],
    declarations: [
        MembersRoleFilterPipe,
        MembershipRoleFilterPipe,
        RandomItemPipe,
        FileSizePipe,
        TimeDurationPipe,
        TimeConversionPipe,
        SafePipe,
        InstanceFilterPipe,
        AuthenticatedContainerComponent,
        LoginComponent,
        SystemNotificationComponent,
        AccountComponent,
        DropdownMenuComponent,
        DropdownMenuButtonComponent,
        DropdownMenuItemComponent,
        TabsComponent,
        TabComponent,
        TabTitleComponent,
        TabActionsComponent,
        TabContentComponent,
        TabTitleIconComponent,
        OwnerSearchComponent,
        ImageComponent,
        InvalidAccountDialogComponent,
        SanitizerPipe,
        NotificationBadgeComponent,
    ]
})
export class SharedModule {
    public static forRoot(): { ngModule: SharedModule; providers: NotifierModule[] } {
        return {
            ngModule: SharedModule,
            providers: [
                NotifierModule,
            ],
        };
    }
}
