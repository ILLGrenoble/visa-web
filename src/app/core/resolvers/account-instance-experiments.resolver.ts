import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AccountService} from '../services';
import {Experiment} from '../models';

@Injectable()
export class AccountInstanceExperimentsResolver implements Resolve<Observable<Experiment[]>> {

    constructor(private accountService: AccountService) {

    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Experiment[]> {
        return this.accountService.getExperimentsForInstances();
    }

}
