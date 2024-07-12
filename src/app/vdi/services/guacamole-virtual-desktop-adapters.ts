import Guacamole from 'guacamole-common-js';
import {ClientAdapter, DisplayAdapter, KeyboardAdapter, MouseAdapter, MouseState} from './virtual-desktop-adapters';

class GuacamoleKeyboardAdapter extends KeyboardAdapter {
    constructor(private _keyboard: Guacamole.Keyboard) {
        super();
    }

    set onkeydown(handler: (keysym: number) => boolean) {
        this._keyboard.onkeydown = handler;
    }

    set onkeyup(handler: (keysym: number) => boolean) {
        this._keyboard.onkeyup = handler;
    }

    reset(): void {
        this._keyboard.reset();
    }
}

class GuacamoleMouseAdapter extends MouseAdapter {

    constructor(private _mouse: Guacamole.Mouse) {
        super();
    }

    set onmousedown(handler: (mouseState: MouseState) => void) {
        this._mouse.onmousedown = handler;
    }

    set onmousemove(handler: (mouseState: MouseState) => void) {
        this._mouse.onmousemove = handler;
    }

    set onmouseup(handler: (mouseState: MouseState) => void) {
        this._mouse.onmouseup = handler;
    }
}

class GuacamoleDisplayAdapter extends DisplayAdapter {

    constructor(private _display: Guacamole.Display) {
        super();
    }

    getHeight(): number {
        return this._display.getHeight();
    }

    getWidth(): number {
        return this._display.getWidth();
    }

    getScale(): number {
        return this._display.getScale();
    }

    scale(scale: number): void {
        this._display.scale(scale);
    }

    showCursor(isShown: boolean): void {
        this._display.showCursor(isShown);
    }

    getElement(): any {
        return this._display.getElement();
    }

    createMouse(element: HTMLElement): MouseAdapter {
        return new GuacamoleMouseAdapter(new Guacamole.Mouse(element));
    }

    createKeyboard(element: HTMLElement | Document): KeyboardAdapter {
        return new GuacamoleKeyboardAdapter(new Guacamole.Keyboard(element));
    }
}

export class GuacamoleClientAdapter extends ClientAdapter {

    private _client: Guacamole.Client;

    constructor(client: Guacamole.Client) {
        super(new GuacamoleDisplayAdapter(client.getDisplay()));
        this._client = client;
    }

    sendKeyEvent(pressed: boolean, keysym: number): void {
        this._client.sendKeyEvent(pressed ? 1 : 0, keysym);
    }

    sendMouseState(mouseState: MouseState): void {
        this._client.sendMouseState(mouseState as Guacamole.Mouse.State);
    }

}
