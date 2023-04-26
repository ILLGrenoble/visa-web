import {inject} from '@angular/core';
import {ResolveFn} from '@angular/router';
import {Observable} from 'rxjs';
import {AccountService} from '../services';
import {Quota} from "../models";

export const accountQuotaResolver: ResolveFn<Observable<Quota>> = () => {
    const accountService = inject(AccountService);
    return accountService.getQuotas();
}

