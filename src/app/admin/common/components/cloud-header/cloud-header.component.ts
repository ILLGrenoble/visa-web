import {Component, OnDestroy, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Apollo} from "apollo-angular";
import gql from "graphql-tag";
import {map, takeUntil} from "rxjs/operators";
import {Observable, Subject} from "rxjs";

@Component({
    selector: 'visa-cloud-admin-header',
    styleUrls: ['./cloud-header.component.scss'],
    templateUrl: './cloud-header.component.html',
})
export class CloudHeaderComponent implements OnInit, OnDestroy {
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    protected hypervisorsAvailable: boolean = false;

    constructor(private readonly apollo: Apollo,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Cloud | Admin | VISA`)) {
            this.titleService.setTitle(`Cloud | Admin | VISA`);
        }

        this.apollo.query<any>({
            query: gql`
                query {
                    hypervisorsAvailable
                }
            `,
            fetchPolicy: 'cache-first'
        }).pipe(
            map(({data}) => ({ hypervisorsAvailable: data.hypervisorsAvailable })),
            takeUntil(this._destroy$)
        ).subscribe(({hypervisorsAvailable}) => {
            this.hypervisorsAvailable = hypervisorsAvailable;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }
}
