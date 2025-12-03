import {Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {
    instanceActivate,
    userActivate,
    DashboardComponent,
    FlavoursComponent,
    ImagesComponent,
    CloudClientsComponent,
    InstanceComponent,
    InstancesComponent,
    NotificationsComponent,
    PlansComponent,
    SecurityGroupsOverviewComponent,
    UsersComponent,
    ApplicationCredentialsComponent,
    SessionsComponent,
    UserComponent,
    ExtensionRequestsComponent,
    HypervisorsComponent,
    AvailabilitiesComponent,
    BookingSettingsComponent,
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
                path: 'compute/instances', component: InstancesComponent,
            },
            {
                path: 'compute/sessions', component: SessionsComponent,
            },
            {
                path: 'compute/extension_requests', component: ExtensionRequestsComponent,
            },
            {
                path: 'compute/instances/:id', component: InstanceComponent, canActivate: [instanceActivate],
            },
            {
                path: 'cloud/providers', component: CloudClientsComponent,
            },
            {
                path: 'cloud/hypervisors', component: HypervisorsComponent,
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
                path: 'booking/settings', component: BookingSettingsComponent,
            },
            {
                path: 'booking/availabilities', component: AvailabilitiesComponent,
            },
            {
                path: 'users', component: UsersComponent,
            },
            {
                path: 'users/:id', component: UserComponent, canActivate: [userActivate],
            },
            {
                path: 'settings/notifications', component: NotificationsComponent,
            },
            {
                path: 'settings/applications', component: ApplicationCredentialsComponent,
            },
        ],
    },
];
