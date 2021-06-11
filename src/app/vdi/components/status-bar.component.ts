import {Component, HostBinding} from '@angular/core';

/**
 * Status bar component
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngx-remote-desktop-status-bar',
  template: `
    <ng-content select="ngx-remote-desktop-status-bar-item"></ng-content>`,
})
export class StatusBarComponent {
  @HostBinding('class') clazz = 'ngx-remote-desktop-status-bar';
}
