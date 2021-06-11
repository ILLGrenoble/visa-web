import { Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'visa-tab-title',
  template: `<ng-template><ng-content></ng-content></ng-template>`,
})
export class TabTitleComponent {

  @ViewChild(TemplateRef)
  public content: TemplateRef<any>;

}
