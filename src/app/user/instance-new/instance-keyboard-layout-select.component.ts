import {Component, Input, Output} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ConfigService} from '@core';

@Component({
    selector: 'visa-keyboard-layout-select',
    templateUrl: './instance-keyboard-layout-select.component.html',
    styleUrls: ['./instance-keyboard-layout-select.component.scss'],
})
export class InstanceKeyboardLayoutSelectComponent {

    private _configurationService: ConfigService;

    private _layouts: { layout: string; name: string, selected: boolean }[] = [];

    private _selectedLayout: { layout: string; name: string, selected: boolean } = null;

    private _selectedLayout$: BehaviorSubject<{ layout: string; name: string, selected: boolean }>
        = new BehaviorSubject<{ layout: string; name: string, selected: boolean }>(null);

    constructor(configurationService: ConfigService) {
        this._configurationService = configurationService;
        this._configurationService.load().then(config => {
            this._layouts = config.desktop.keyboardLayouts;
            this.handleSelectedLayout(this._layouts.find(layout => layout.selected));
        });
    }

    get layouts(): ({ layout: string; name: string, selected: boolean })[] {
        return this._layouts;
    }

    @Input()
    set layouts(value: ({ layout: string; name: string, selected: boolean })[]) {
        this._layouts = value;
    }

    @Output('layout')
    get selectedLayout$(): BehaviorSubject<{ layout: string; name: string; selected: boolean }> {
        return this._selectedLayout$;
    }

    set selectedLayout$(value: BehaviorSubject<{ layout: string; name: string; selected: boolean }>) {
        this._selectedLayout$ = value;
    }

    get selectedLayout(): { layout: string; name: string; selected: boolean } {
        return this._selectedLayout;
    }

    set selectedLayout(value: { layout: string; name: string; selected: boolean }) {
        this._selectedLayout = value;
    }

    public handleSelectedLayout(value: { layout: string; name: string; selected: boolean }): void {
        this._selectedLayout = value;
        this._selectedLayout$.next(value);
    }


}
