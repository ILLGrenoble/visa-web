import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Instance} from 'app/core/graphql';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map} from 'rxjs/operators';

@Injectable()
export class InstanceActivate implements CanActivate {

    constructor(private router: Router,
                private snackBar: MatSnackBar,
                private apollo: Apollo,
    ) {

    }

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): Observable<boolean> {
        return this.apollo.query<Instance>({
            query: gql`
              query Instance($id: Int!) {
                instance(id: $id) {
                    id
                  }
                }
              `,
            variables: {
                id: route.params.id,
            },
        })
            .pipe(map((response) => {
                if (response.data) {
                    return true;
                } else {
                    this.router.navigate(['/admin']);
                    this.snackBar.open('Instance not found', 'OK');
                    return false;
                }
            }));
    }
}
