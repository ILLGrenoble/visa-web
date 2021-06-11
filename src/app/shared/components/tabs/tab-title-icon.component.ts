import { Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'visa-tab-title-icon',
  template: `<ng-template><ng-content></ng-content></ng-template>`,
})
export class TabTitleIconComponent {

  @ViewChild(TemplateRef)
  public content: TemplateRef<any>;

}
