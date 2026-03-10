import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {BookingDetailsComponent, BookingHomeComponent, BookingNewComponent} from './components';
import {authenticationGuard} from "../core";

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                component: BookingHomeComponent,
                canActivate: [authenticationGuard],
            },
            {
                path: 'new',
                component: BookingNewComponent,
                canActivate: [authenticationGuard],
            },
            {
                path: ':uid',
                component: BookingDetailsComponent,
                canActivate: [authenticationGuard],
            },
            {
                path: ':uid/edit',
                component: BookingNewComponent,
                canActivate: [authenticationGuard],
            },
        ]
    }
];

export const ROUTING = RouterModule.forChild(ROUTES);
