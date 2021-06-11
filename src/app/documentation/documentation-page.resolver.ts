import {Injectable} from '@angular/core';

import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {DocumentationService} from '@core';
import {FrontMatterResult} from 'front-matter';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable()
export class DocumentationPageResolver implements Resolve<Observable<FrontMatterResult<any>>> {

    constructor(private documentationService: DocumentationService,
                private route: ActivatedRoute,
                private router: Router,
                private snackBar: MatSnackBar) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<FrontMatterResult<any>> {
        const section = route.params.section;
        const page = route.params.page;

        return this.documentationService.getPage(`${section}/${page}`)
            .pipe(catchError((err: any) => {
                this.router.navigate(['/']).then(() => {
                    this.snackBar.open('Documentation page not found', 'OK');
                });
                return throwError('Error fetching page');
            }));
    }

}
