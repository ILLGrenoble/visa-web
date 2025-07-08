import { Component } from '@angular/core';

@Component({
    selector: 'ngx-remote-desktop-waiting-message',
    host: { class: 'ngx-remote-desktop-message'},
    template: `
        <ng-content></ng-content>
    `
})
export class WaitingMessageComponent {
}
