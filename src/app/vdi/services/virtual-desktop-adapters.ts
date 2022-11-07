export class MouseState {
    constructor(public x: number,
                public y: number,
                public left: boolean,
                public middle: boolean,
                public right: boolean,
                public up: boolean,
                public down: boolean) {
    }

    fromClientPosition(element: HTMLElement, clientX: number, clientY: number): void {

        this.x = clientX - element.offsetLeft;
        this.y = clientY - element.offsetTop;

        // This is all JUST so we can get the mouse position within the element
        let parent = element.offsetParent as HTMLElement;
        while (parent && !(parent === document.body)) {
            this.x -= parent.offsetLeft - parent.scrollLeft;
            this.y -= parent.offsetTop  - parent.scrollTop;

            parent = parent.offsetParent as HTMLElement;
        }

        // Element ultimately depends on positioning within document body, take document scroll into account.
        if (parent) {
            const documentScrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
            const documentScrollTop = document.body.scrollTop || document.documentElement.scrollTop;

            this.x -= parent.offsetLeft - documentScrollLeft;
            this.y -= parent.offsetTop  - documentScrollTop;
        }
    }
}

export abstract class KeyboardAdapter {
    abstract set onkeyup(handler: (keysym: number) => boolean);
    abstract set onkeydown(handler: (keysym: number) => boolean);
    abstract reset(): void;
}

export abstract class MouseAdapter {
    abstract set onmousedown(handler: (mouseState: MouseState) => void);
    abstract set onmouseup(handler: (mouseState: MouseState) => void);
    abstract set onmousemove(handler: (mouseState: MouseState) => void);
}

export abstract class DisplayAdapter {
    abstract createMouse(element: Element): MouseAdapter;
    abstract createKeyboard(element: Element | Document): KeyboardAdapter;

    abstract showCursor(isShown: boolean): void;
    abstract getScale(): number;
    abstract scale(scale: number): void;
    abstract getWidth(): number;
    abstract getHeight(): number;
    abstract getElement(): any;
}

export abstract class ClientAdapter {

    protected constructor(private _displayAdapter: DisplayAdapter) {
    }

    getDisplay(): DisplayAdapter {
        return this._displayAdapter;
    }

    abstract sendMouseState(mouseState: MouseState): void;
    abstract sendKeyEvent(pressed: number, keysym: number): void;

}
