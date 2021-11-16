import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {InstancesComponent} from './components';

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                redirectTo: 'instances',
                pathMatch: 'full'
            },
            {
                path: 'instances', component: InstancesComponent
            },
        ]
    }
];

export const ROUTING = RouterModule.forChild(ROUTES);
