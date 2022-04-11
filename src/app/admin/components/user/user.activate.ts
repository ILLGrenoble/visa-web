import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Instance} from 'app/core/graphql';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

@Injectable()
export class UserActivate implements CanActivate {

    constructor(private router: Router,
                private notifierService: NotifierService,
                private apollo: Apollo,
    ) {

    }

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): Observable<boolean> {
        return this.apollo.query<Instance>({
            query: gql`
              query User($id: String!) {
                user(id: $id) {
                    id
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
                    this.router.navigate(['/admin']);
                    this.notifierService.notify('error', 'User not found');
                    return false;
                }
            })
        );
    }
}
