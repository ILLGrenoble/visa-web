import {
    AfterViewChecked,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnDestroy,
    Output,
    Renderer2,
    ViewChild,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {
    ClientAdapter,
    DisplayAdapter,
    KeyboardAdapter,
    MouseAdapter,
    MouseState,
    ScaleMode,
    VirtualDesktopManager
} from '../services';
import {Touchscreen} from '../inputs';

@Component({
    selector: 'ngx-remote-desktop-display',
    template: `
        <div [ngClass]="{ 'ngx-remote-desktop-scrollable-container' : !isScaled(), 'ngx-remote-desktop-scrollable-container-centered' : !isScrollable()}">
            <div [ngClass]="{ 'ngx-remote-desktop-display--scrollbar' : isScrollable(),
                                'ngx-remote-desktop-display--overflow-x' : isScrollableX(),
                                'ngx-remote-desktop-display--overflow-y' : isScrollableY(),
                                'ngx-remote-desktop-display--overflow-xy' : isScrollableXY()}" #display
                 (panmove)="handlePan($event)"
                 (panend)="handlePanEnd($event)"
                 (tap)="handleTap($event)"
                 (press)="handlePress($event)">
            </div>
        </div>
    `,
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayComponent implements OnDestroy, AfterViewInit, AfterViewChecked {

    @HostBinding('class')
    public hostClass = 'ngx-remote-desktop-viewport';

    /**
     * Emit the mouse move events to any subscribers
     */
    @Output()
    public mouseMove$ = new BehaviorSubject(null);

    /**
     * Remote desktop manager
     */
    @Input()
    private manager: VirtualDesktopManager;

    @ViewChild('display')
    private display: ElementRef;

    /**
     * Remote desktop keyboard
     */
    private keyboard: KeyboardAdapter;

    /**
     * Remote desktop mouse
     */
    private mouse: MouseAdapter;

    /**
     * Subscriptions
     */
    private subscriptions: Subscription[] = [];

    private touchscreen: Touchscreen;

    constructor(private viewport: ElementRef, private renderer: Renderer2, private cdr: ChangeDetectorRef) {
    }

    ngAfterViewChecked(): void {
        this.setDisplayScaleMode();
    }

    /**
     * Unbind all display input listeners when destroying the component
     */
    ngOnDestroy(): void {
        this.removeDisplay();
        this.removeDisplayInputListeners();
        this.unbindSubscriptions();
    }


    /**
     * Bind all subscriptions
     */
    private bindSubscriptions(): void {
        this.subscriptions.push(this.manager.onKeyboardReset.subscribe(_ => this.resetKeyboard()));
        this.subscriptions.push(this.manager.onFocused.subscribe(this.handleFocused.bind(this)));
        this.subscriptions.push(this.manager.scaleMode.subscribe(this.handleScaleMode.bind(this)));
    }

    /**
     * Unbind all subscriptions
     */
    private unbindSubscriptions(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * Bind input listeners if display is focused, otherwise, unbind
     */
    private handleFocused(newFocused: boolean): void {
        if (newFocused) {
            this.bindDisplayInputListeners();
        } else {
            this.removeDisplayInputListeners();
        }
    }

    /**
     * Bind input listeners to display scale mode
     */
    private handleScaleMode(newScaleMode: ScaleMode): void {
        this.setDisplayScaleMode();
    }

    /**
     * Release all the keyboards when the window loses focus
     * @param event the blue event
     */
    @HostListener('window:blur', ['$event'])
    public onWindowBlur(event: any): void {
        this.resetKeyboard();
    }

    /**
     * Resize the display scale when the window is resized
     * @param event the resize event
     */
    @HostListener('window:resize', ['$event'])
    public onWindowResize(event: any): void {
        this.setDisplayScaleMode();
    }

    /**
     * Create the remote desktop display and bind the event handlers
     */
    private createDisplayCanvas(): void {
        this.createDisplay();
        this.createDisplayInputs();
        this.bindDisplayInputListeners();
    }

    /**
     * Get the remote desktop display and set the scale
     */
    private setDisplayScaleMode(): void {
        const display = this.getDisplay();

        const scale = this.getScale();
        display.scale(scale);
    }

    private getScale(): number {
        const display = this.getDisplay();
        const scaleMode = this.manager.getScaleMode();
        if (scaleMode === ScaleMode.Scaled) {
            return this.calculateDisplayScale(display);

        } else if (scaleMode === ScaleMode.Unscaled) {
            return 1.0;

        } else if (scaleMode === ScaleMode.Optimal) {
            // Fill full screen
            return this.calculateOptimalDisplayScale(display);
        }
    }

    /**
     * Get the remote desktop display
     */
    private getDisplay(): DisplayAdapter {
        return this.manager.getClient().getDisplay();
    }

    /**
     * Get the remote desktop client
     */
    private getClient(): ClientAdapter {
        return this.manager.getClient();
    }

    /**
     * Calculate the scale for the display
     */
    private calculateDisplayScale(display: DisplayAdapter): number {
        const viewportElement = this.viewport.nativeElement;
        return Math.min(
            viewportElement.clientWidth / display.getWidth(),
            viewportElement.clientHeight / display.getHeight()
        );
    }

    /**
     * Calculate the optimal scale for the display os that there are no black borders
     */
    private calculateOptimalDisplayScale(display: DisplayAdapter): number {
        const viewportElement = this.viewport.nativeElement;

        const viewportAspectRatio = viewportElement.clientWidth / viewportElement.clientHeight;
        const displayAspectRatio = display.getWidth() / display.getHeight();
        if (viewportAspectRatio === displayAspectRatio) {
            return  (viewportElement.clientWidth - 9) / display.getWidth();

        } else if (viewportAspectRatio > displayAspectRatio) {
            return  (viewportElement.clientWidth - 9) / display.getWidth();

        } else {
            return  (viewportElement.clientHeight - 9) / display.getHeight();
        }
    }

    /**
     * Assign the display to the client
     */
    private createDisplay(): void {
        const element = this.display.nativeElement;
        const display = this.getDisplay();
        if (this.isTouchDevice()) {
            /**
             * only show the emulated cursor if it is a touch device
             * This could give false positives
             * For example a hybrid laptop that has a touch screen will return true,
             * however, there is no simple 100% proof way to check if the device is a smartphone or a tablet without
             * doing a lot of conditional checking
             */
            display.showCursor(true);
        }

        this.renderer.appendChild(element, display.getElement());

        // @ts-ignore
        if (navigator.keyboard) {
            // @ts-ignore
            navigator.keyboard.lock();
        }
    }

    /**
     * Check if the current device is touch enabled
     */
    private isTouchDevice(): boolean {
        return 'ontouchstart' in window;
    }

    /**
     * Check if display is scaled
     */
    public isScaled(): boolean {

        if (this.manager.getScaleMode() === ScaleMode.Scaled) {
            const viewportElement = this.viewport.nativeElement;
            const display = this.getDisplay();

            return viewportElement.clientWidth !== display.getWidth() || viewportElement.clientHeight !== display.getHeight();
        }
        return false;
    }

    /**
     * Check if display should have scrollbars
     */
    public isScrollable(): boolean {
        const viewportElement = this.viewport.nativeElement;
        const display = this.getDisplay();

        return viewportElement.clientWidth < display.getWidth() * this.getScale()
            || viewportElement.clientHeight < display.getHeight() * this.getScale();
    }

    /**
     * Check if display should have horizontal scrollbar only
     */
    public isScrollableX(): boolean {
        const viewportElement = this.viewport.nativeElement;
        const display = this.getDisplay();

        return viewportElement.clientWidth < display.getWidth() * this.getScale() &&
            viewportElement.clientHeight >= display.getHeight() * this.getScale();
    }

    /**
     * Check if display should have vertical scrollbar only
     */
    public isScrollableY(): boolean {
        const viewportElement = this.viewport.nativeElement;
        const display = this.getDisplay();

        return viewportElement.clientHeight < display.getHeight() * this.getScale() &&
            viewportElement.clientWidth >= display.getWidth() * this.getScale();
    }

    /**
     * Check if display should have horizontal and vertical scrollbar only
     */
    public isScrollableXY(): boolean {
        const viewportElement = this.viewport.nativeElement;
        const display = this.getDisplay();

        return viewportElement.clientHeight < display.getHeight() * this.getScale() &&
            viewportElement.clientWidth < display.getWidth() * this.getScale();
    }

    /**
     * Remove the display
     */
    private removeDisplay(): void {
        const element = this.display.nativeElement;
        const display = this.getDisplay();
        this.renderer.removeChild(element, display.getElement());
    }

    /**
     * Bind input listeners for keyboard and mouse
     */
    private bindDisplayInputListeners(): void {
        this.removeDisplayInputListeners();
        this.mouse.onmousedown = this.mouse.onmouseup = this.mouse.onmousemove = this.handleMouseState.bind(this);
        this.keyboard.onkeyup = this.handleKeyUp.bind(this);
        this.keyboard.onkeydown = this.handleKeyDown.bind(this);
        this.touchscreen.onmousedown = this.touchscreen.onmouseup = this.touchscreen.onmousemove = this.handleMouseState.bind(this);
    }

    /**
     * Remove all input listeners
     */
    private removeDisplayInputListeners(): void {
        if (this.keyboard) {
            this.keyboard.onkeydown = null;
            this.keyboard.onkeyup = null;
        }
        if (this.mouse) {
            this.mouse.onmousedown = this.mouse.onmouseup = this.mouse.onmousemove = null;
        }
        if (this.touchscreen) {
            this.touchscreen.onmousedown = this.touchscreen.onmouseup = this.touchscreen.onmousemove = null;
        }
    }

    /**
     * Create the keyboard and mouse inputs
     */
    private createDisplayInputs(): void {
        const display = this.display.nativeElement.children[0];
        this.mouse = this.getDisplay().createMouse(display);
        this.keyboard = this.getDisplay().createKeyboard(window.document);
        this.touchscreen = new Touchscreen(display);
    }

    /**
     * Send mouse events to the remote desktop
     * @param mouseState the new mouse state
     */
    private handleMouseState(mouseState: any): void {
        // Get the scroll offset
        const scrollLeft = this.display.nativeElement.scrollLeft;
        const scrollTop = this.display.nativeElement.scrollTop;

        const display = this.getDisplay();
        const scale = display.getScale();
        const scaledState = new MouseState(
            (mouseState.x + scrollLeft) / scale,
            (mouseState.y + scrollTop) / scale,
            mouseState.left,
            mouseState.middle,
            mouseState.right,
            mouseState.up,
            mouseState.down);
        // this.scrollToMouse(mouseState);
        this.getClient().sendMouseState(scaledState);
        this.mouseMove$.next(mouseState);
    }

    /**
     * Resetting the keyboard will release all keys
     */
    private resetKeyboard(): void {
        if (this.keyboard) {
            this.keyboard.reset();
        }
    }

    /**
     * Send key down event to the remote desktop
     * @param key the keyboard key
     */
    private handleKeyDown(key: any): void {
        this.getClient().sendKeyEvent(true, key);
    }

    /**
     * Send key up event to the remote desktop
     * @param key the keyboard key
     */
    private handleKeyUp(key: any): void {
        this.getClient().sendKeyEvent(false, key);
    }

    ngAfterViewInit(): void {
        this.createDisplayCanvas();
        this.bindSubscriptions();
    }


    public scrollToMouse(mouseState: any): void {

        const main = document.getElementsByClassName('ngx-remote-desktop-container')[0] as HTMLElement;
        // Determine mouse position within view
        const mouseViewX = mouseState.x + this.display.nativeElement.offsetLeft - main.scrollLeft;
        const mouseViewY = mouseState.y + this.display.nativeElement.offsetTop - main.scrollTop;


        // Determine viewport dimensions
        const viewWidth = main.offsetWidth;
        const viewHeight = main.offsetHeight;

        // Determine scroll amounts based on mouse position relative to document

        let scrollAmountX;
        if (mouseViewX > viewWidth) {
            scrollAmountX = mouseViewX - viewWidth;
        } else if (mouseViewX < 0) {
            scrollAmountX = mouseViewX;
        } else {
            scrollAmountX = 0;
        }

        let scrollAmountY;
        if (mouseViewY > viewHeight) {
            scrollAmountY = mouseViewY - viewHeight;
        } else if (mouseViewY < 0) {
            scrollAmountY = mouseViewY;
        } else {
            scrollAmountY = 0;
        }

        // Scroll (if necessary) to keep mouse on screen.
        main.scrollLeft += scrollAmountX;
        main.scrollTop += scrollAmountY;

    }

    public handlePan(event): void {
        if (this.touchscreen) {
            this.touchscreen.handlePan(event);
        }
    }

    public handleTap(event): void {
        if (this.touchscreen) {
            this.touchscreen.handleTap(event);
        }
    }

    public handlePress(event): void {
        if (this.touchscreen) {
            this.touchscreen.handlePress(event);
        }
    }
    public handlePanEnd(event): void {
        if (this.touchscreen) {
            this.touchscreen.handlePanEnd(event);
        }
    }
}
