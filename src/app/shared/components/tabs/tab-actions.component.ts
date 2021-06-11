import { Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'visa-tab-actions',
  template: `<ng-template><ng-content></ng-content></ng-template>`,
})
export class TabActionsComponent {

  @ViewChild(TemplateRef)
  public content: TemplateRef<any>;

}
