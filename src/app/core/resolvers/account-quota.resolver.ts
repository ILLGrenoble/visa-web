import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {Quota} from '../models';
import {AccountService} from '../services';

@Injectable()
export class AccountQuotaResolver implements Resolve<Observable<Quota>> {

    constructor(private accountService: AccountService) {

    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Quota> {
        return this.accountService.getQuotas();
    }

}
