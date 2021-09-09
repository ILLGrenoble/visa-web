import {Routes} from '@angular/router';
import {AuthenticationGuard} from '@core';
import {AuthenticatedContainerComponent} from '@shared';
import {
    DashboardComponent,
    FlavoursComponent,
    ImagesComponent,
    InstanceActivate,
    InstanceComponent,
    InstancesComponent,
    NotificationsComponent,
    PlansComponent, UsersComponent,
} from './components';
import {SessionsComponent} from './components/sessions';

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full',
            },
            {
                path: 'dashboard', component: DashboardComponent,
            },
            {
                path: 'instances', component: InstancesComponent,
            },
            {
                path: 'cloud/images', component: ImagesComponent,
            },
            {
                path: 'cloud/flavours', component: FlavoursComponent,
            },
            {
                path: 'cloud/plans', component: PlansComponent,
            },
            {
                path: 'instances/:id', component: InstanceComponent, canActivate: [InstanceActivate],
            },
            {
                path: 'users', component: UsersComponent,
            },
            {
                path: 'sessions', component: SessionsComponent,
            },
            {
                path: 'notifications', component: NotificationsComponent,
            },
        ],
    },
];
