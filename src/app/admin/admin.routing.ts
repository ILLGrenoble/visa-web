import {Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {
    DashboardComponent,
    FlavoursComponent,
    ImagesComponent,
    InstanceActivate,
    InstanceComponent,
    InstancesComponent,
    NotificationsComponent,
    PlansComponent,
    SecurityGroupsOverviewComponent,
    UsersComponent,
    SessionsComponent
} from './components';

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
                path: 'cloud/security_groups', component: SecurityGroupsOverviewComponent,
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
