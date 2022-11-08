import {ClientAdapter, DisplayAdapter, KeyboardAdapter, MouseAdapter, MouseState} from './virtual-desktop-adapters';
import {
    WebXClient,
    WebXDisplay,
    WebXKeyboard,
    WebXMouse,
    WebXMouseState
} from '../../../../../../webx/webx-web/webx-web/src';

class WebXKeyboardAdapter extends KeyboardAdapter {
    constructor(private _keyboard: WebXKeyboard) {
        super();
    }

    set onkeydown(handler: (keysym: number) => boolean) {
        this._keyboard.onKeyDown = handler;
    }

    set onkeyup(handler: (keysym: number) => boolean) {
        this._keyboard.onKeyUp = handler;
    }

    reset(): void {
        this._keyboard.reset();
    }
}

class WebXMouseAdapter extends MouseAdapter {

    constructor(private _mouse: WebXMouse) {
        super();
    }

    set onmousedown(handler: (mouseState: MouseState) => void) {
        this._mouse.onMouseDown = handler;
    }

    set onmousemove(handler: (mouseState: MouseState) => void) {
        this._mouse.onMouseMove = handler;
    }

    set onmouseup(handler: (mouseState: MouseState) => void) {
        this._mouse.onMouseUp = handler;
    }
}

export class WebXDisplayAdapter extends DisplayAdapter {

    // Create a parent container for the webx display (webx requires a parent when connecting, guacamole doesn't)
    private _element: HTMLElement;

    private get display(): WebXDisplay {
        return this._client.display;
    }

    constructor(private _client: WebXClient) {
        super();
        this._createElement();
    }

    getHeight(): number {
        return this.display.screenHeight;
    }

    getWidth(): number {
        return this.display.screenWidth;
    }

    getScale(): number {
        return this.display.scale;
    }

    scale(scale: number): void {
        this.display.resize(scale);
    }

    showCursor(isShown: boolean): void {
        // todo
    }

    getElement(): any {
        return this._element;
    }

    createMouse(element: HTMLElement): MouseAdapter {
        return new WebXMouseAdapter(new WebXMouse(element));
    }

    createKeyboard(element: HTMLElement | Document): KeyboardAdapter {
        return new WebXKeyboardAdapter(new WebXKeyboard(element));
    }

    private _createElement(): void {
        this._element = document.createElement('div');
        this._element.style.position = 'relative';
        this._element.style.display = 'flex';
        this._element.style.alignItems =  'center';
        this._element.style.justifyContent = 'center';
    }
}

export class WebXClientAdapter extends ClientAdapter {

    private _client: WebXClient;

    constructor(client: WebXClient) {
        super(new WebXDisplayAdapter(client));
        this._client = client;
    }

    sendKeyEvent(pressed: boolean, keysym: number): void {
        this._client.sendKeyEvent(keysym, pressed);
    }

    sendMouseState(mouseState: MouseState): void {

        this._client.sendMouse(new WebXMouseState(mouseState));
    }

}
