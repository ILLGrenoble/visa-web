import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {BookingDetailsComponent, BookingHomeComponent, BookingNewComponent} from './components';

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                component: BookingHomeComponent
            },
            {
                path: 'new',
                component: BookingNewComponent
            },
            {
                path: ':uid',
                component: BookingDetailsComponent
            },
        ]
    }
];

export const ROUTING = RouterModule.forChild(ROUTES);
