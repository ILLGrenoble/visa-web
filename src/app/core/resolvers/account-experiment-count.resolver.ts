import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AccountService} from '../services';

@Injectable()
export class AccountExperimentCountResolver implements Resolve<Observable<number>> {

    constructor(private accountService: AccountService) {

    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<number> {
        return this.accountService.getExperimentCount();
    }

}
