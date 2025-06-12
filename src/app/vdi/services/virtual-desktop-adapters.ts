export class MouseState {
    constructor(public x: number,
                public y: number,
                public left: boolean,
                public middle: boolean,
                public right: boolean,
                public up: boolean,
                public down: boolean) {
    }
}

export abstract class KeyboardAdapter {
    abstract set onkeyup(handler: (keysym: number) => boolean);
    abstract set onkeydown(handler: (keysym: number) => boolean);
    abstract reset(): void;
    abstract dispose(): void;
}

export abstract class MouseAdapter {
    abstract set onmousedown(handler: (mouseState: MouseState) => void);
    abstract set onmouseup(handler: (mouseState: MouseState) => void);
    abstract set onmousemove(handler: (mouseState: MouseState) => void);
    abstract dispose(): void;
}

export abstract class DisplayAdapter {
    abstract createMouse(element: HTMLElement): MouseAdapter;
    abstract createKeyboard(element: HTMLElement | Document): KeyboardAdapter;

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

    abstract sendMouseState(mouseState: MouseState, scale: number, scrollLeft: number, scrollTop: number): void;
    abstract sendKeyEvent(pressed: boolean, keysym: number): void;

}
