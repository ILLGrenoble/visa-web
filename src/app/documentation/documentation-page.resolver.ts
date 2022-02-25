import {Injectable} from '@angular/core';

import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {DocumentationService} from '@core';
import {FrontMatterResult} from 'front-matter';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

@Injectable()
export class DocumentationPageResolver implements Resolve<Observable<FrontMatterResult<any>>> {

    constructor(private documentationService: DocumentationService,
                private route: ActivatedRoute,
                private router: Router,
                private notifierService: NotifierService) {
    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<FrontMatterResult<any>> {
        const section = route.params.section;
        const page = route.params.page;

        return this.documentationService.getPage(`${section}/${page}`)
            .pipe(catchError((err: any) => {
                this.router.navigate(['/']).then(() => {
                    this.notifierService.notify('error', 'Documentation page not found');
                });
                return throwError('Error fetching page');
            }));
    }

}
