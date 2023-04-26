import {inject} from '@angular/core';
import {ResolveFn} from '@angular/router';
import {Observable} from 'rxjs';
import {AccountService} from '../services';

export const accountExperimentCountResolver: ResolveFn<Observable<number>> = () => {
    const accountService = inject(AccountService);
    return accountService.getExperimentCount();
}

