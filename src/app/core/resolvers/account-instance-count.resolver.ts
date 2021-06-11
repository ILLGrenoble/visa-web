import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {AccountService} from '../services';
import {Observable} from 'rxjs';

@Injectable()
export class AccountInstanceCountResolver implements Resolve<Observable<number>> {

    constructor(private accountService: AccountService) {

    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<number> {
        return this.accountService.getCountInstances();
    }

}
