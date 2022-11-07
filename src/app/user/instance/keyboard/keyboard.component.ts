import {AfterViewInit, Component, ElementRef, Inject, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {OnScreenKeyboard} from '@illgrenoble/visa-guacamole-common-js';
import {VirtualDesktopManager} from '@vdi';
import {de, en, fr} from './layouts';

@Component({
    selector: 'visa-instance-keyboard-dialog',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class KeyboardComponent implements AfterViewInit {

    public manager: VirtualDesktopManager;

    public layouts = [
        {id: 'en', value: 'Qwerty', layout: en},
        {id: 'fr', value: 'Azerty', layout: fr},
        {id: 'de', value: 'Qwertz', layout: de},
    ];

    public selectedLayout = this.layouts[0];

    private keyboard: OnScreenKeyboard;

    @ViewChild('container')
    private container: ElementRef;

    constructor(private dialogRef: MatDialogRef<KeyboardComponent>,
                @Inject(MAT_DIALOG_DATA)
                private data: any,
                private el: ElementRef,
                private renderer: Renderer2) {
        this.manager = data.manager;
    }

    public onNoClick(): void {
        this.keyboard.reset();
        this.dialogRef.close();
    }

    public handleLayoutChange($event: any): void {
        this.removeKeyboardDisplay();
        this.createKeyboardDisplay(this.selectedLayout.layout);
    }

    public ngAfterViewInit(): void {
        this.createKeyboardDisplay(this.selectedLayout.layout);
    }

    private createKeyboard(layoutId: string): OnScreenKeyboard {
        const layout = new OnScreenKeyboard.Layout(layoutId);
        return new OnScreenKeyboard(layout);
    }

    private bindKeyboardHandlers(): void {
        this.keyboard.onkeydown = this.handleKeyDown.bind(this);
        this.keyboard.onkeyup = this.handleKeyUp.bind(this);
    }

    private handleKeyDown(key: number): void {
        this.manager.getClient().sendKeyEvent(true, key);
    }

    private handleKeyUp(key: number): void {
        this.manager.getClient().sendKeyEvent(false, key);
    }

    private removeKeyboardDisplay(): void {
        const element = this.container.nativeElement;
        this.renderer.removeChild(element, this.keyboard.getElement());
    }

    private createKeyboardElement(): void {
        const element = this.container.nativeElement;
        this.renderer.appendChild(element, this.keyboard.getElement());
        this.keyboard.resize(element.offsetWidth);
    }

    private createKeyboardDisplay(layoutId): void {
        this.keyboard = this.createKeyboard(layoutId);
        this.createKeyboardElement();
        this.bindKeyboardHandlers();
    }

}
