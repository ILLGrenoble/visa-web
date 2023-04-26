import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {inject} from '@angular/core';
import {Instance} from 'app/core/graphql';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

export const instanceActivate: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean> => {
    const apollo = inject(Apollo);
    const router = inject(Router);
    const notifierService = inject(NotifierService);

    return apollo.query<Instance>({
        query: gql`
              query Instance($id: Int!) {
                instance(id: $id) {
                    id
                    uid
                  }
                }
              `,
        variables: {
            id: route.params.id,
        },
    }).pipe(
        map((response) => {
            if (response.data) {
                return true;
            } else {
                router.navigate(['/admin']);
                notifierService.notify('error', 'Instance not found');
                return false;
            }
        })
    );
}
