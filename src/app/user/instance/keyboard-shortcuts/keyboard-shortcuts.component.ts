import {Component, Output} from '@angular/core';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-instance-keyboard-shortcuts',
    templateUrl: './keyboard-shortcuts.component.html',
})
export class KeyboardShortcutsComponent {

    // tslint:disable-next-line:no-output-native
    @Output()
    public close: Subject<null> = new Subject();

}
