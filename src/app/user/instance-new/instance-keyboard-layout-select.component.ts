import {Component, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {ConfigService} from '@core';
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-keyboard-layout-select',
    templateUrl: './instance-keyboard-layout-select.component.html',
    styleUrls: ['./instance-keyboard-layout-select.component.scss'],
})
export class InstanceKeyboardLayoutSelectComponent implements OnInit, OnDestroy {

    private static USER_INSTANCE_KEYBOARD_LAYOUT_KEY = 'user.instance.keyboard.layout';

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _configurationService: ConfigService;

    private _layouts: { layout: string; name: string, selected: boolean }[] = [];

    private _selectedLayout: { layout: string; name: string, selected: boolean } = null;

    private _selectedLayout$: BehaviorSubject<{ layout: string; name: string, selected: boolean }>
        = new BehaviorSubject<{ layout: string; name: string, selected: boolean }>(null);

    constructor(configurationService: ConfigService) {
        this._configurationService = configurationService;
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
        localStorage.setItem(InstanceKeyboardLayoutSelectComponent.USER_INSTANCE_KEYBOARD_LAYOUT_KEY, value.layout);
    }

    ngOnInit(): void {
        this._configurationService.configuration$()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                this._layouts = config.desktop.keyboardLayouts;
                const localKeyboardLayout = localStorage.getItem(InstanceKeyboardLayoutSelectComponent.USER_INSTANCE_KEYBOARD_LAYOUT_KEY);
                if (localKeyboardLayout != null) {
                    const keyboardLayout = this._layouts.find(layout => layout.layout === localKeyboardLayout);
                    if (keyboardLayout) {
                        this.handleSelectedLayout(keyboardLayout);
                    }
                } else {
                    this.handleSelectedLayout(this._layouts.find(layout => layout.selected));
                }
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

}
