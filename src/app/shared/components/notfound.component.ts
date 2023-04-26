import {Component} from '@angular/core';

@Component({
    selector: 'visa-not-found',
    template: `
        <div class="blankslate-container">
            <div class="blankslate" style="border: none">
                <h2 class="mb-1">Page not found</h2>
                <p>We couldn't find the page you requested</p>
                <button class="btn btn-primary my-3" type="button" [routerLink]="['/']">Go back to homepage</button>
            </div>
        </div>
    `,
})
export class NotfoundComponent {

}
