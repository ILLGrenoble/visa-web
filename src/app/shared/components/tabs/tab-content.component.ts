import { Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'visa-tab-content',
  template: `<ng-template><ng-content></ng-content></ng-template>`,
})
export class TabContentComponent {

  @ViewChild(TemplateRef)
  public content: TemplateRef<any>;

}
