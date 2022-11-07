import {MouseState} from '../services/virtual-desktop-adapters';

export class Touchscreen {

    private readonly _currentState: MouseState;
    private readonly _element: HTMLElement;

    public onmousedown: (state: MouseState) => void = null;
    public onmouseup: (state: MouseState) => void = null;
    public onmousemove: (state: MouseState) => void = null;

    constructor(element: HTMLElement) {
        this._element = element;
        this._currentState =  new MouseState(
            0, 0,
            false, false, false, false, false
        );
    }

    private isTouchEvent = (event): boolean => event.pointerType === 'touch';

    public handlePanEnd(event): void {
        if (this.isTouchEvent(event)) {
            this.release('left');
        }
    }

    private move(x, y): void {
        this.setFromClientPosition(x, y);
        if (this.onmousemove) {
            this.onmousemove(this._currentState);
        }
    }

    private click(button: string): void {
        this.press(button);
        this.release(button);
    }

    private press(button: string): void {
        if (!this._currentState[button]) {
            this._currentState[button] = true;
            if (this.onmousedown) {
                this.onmousedown(this._currentState);
            }
        }
    }

    private release(button: string): void {
        if (this._currentState[button]) {
            this._currentState[button] = false;
            if (this.onmouseup) {
                this.onmouseup(this._currentState);
            }
        }
    }

    public handlePan(event): void {
        if (this.isTouchEvent(event)) {
            const {x, y} = event.srcEvent;
            this.press('left');
            this.move(x, y);
        }
    }

    public handleTap(event): void {
        if (this.isTouchEvent(event)) {
            const {x, y} = event.srcEvent;
            this.move(x, y);
            this.click('left');
        }
    }

    public handlePress(event): void {
        if (this.isTouchEvent(event)) {
            const {x, y} = event.srcEvent;
            this.move(x, y);
            this.click('right');
        }
    }

    private setFromClientPosition(clientX: number, clientY: number): void {

        this._currentState.x = clientX - this._element.offsetLeft;
        this._currentState.y = clientY - this._element.offsetTop;

        // This is all JUST so we can get the mouse position within the element
        let parent = this._element.offsetParent as HTMLElement;
        while (parent && !(parent === document.body)) {
            this._currentState.x -= parent.offsetLeft - parent.scrollLeft;
            this._currentState.y -= parent.offsetTop  - parent.scrollTop;

            parent = parent.offsetParent as HTMLElement;
        }

        // Element ultimately depends on positioning within document body, take document scroll into account.
        if (parent) {
            const documentScrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
            const documentScrollTop = document.body.scrollTop || document.documentElement.scrollTop;

            this._currentState.x -= parent.offsetLeft - documentScrollLeft;
            this._currentState.y -= parent.offsetTop  - documentScrollTop;
        }

    }

}
