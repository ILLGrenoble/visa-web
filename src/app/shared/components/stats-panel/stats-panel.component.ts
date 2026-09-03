import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {debounceTime, Subject} from "rxjs";

@Component({
    selector: 'visa-stats-panel',
    templateUrl: './stats-panel.component.html',
    styleUrls: ['./stats-panel.component.scss'],
})
export class StatsPanelComponent implements AfterViewInit, OnInit {

    @ViewChild('statsCanvas')
    private _canvasRef: ElementRef<HTMLCanvasElement>;
    private _context: CanvasRenderingContext2D;
    private _refreshEvent$: Subject<void> = new Subject<void>();

    private _width: number = 64;
    private _height: number = 16;
    private _unit: string = '';
    private _min: number;
    private _data: number[] = [];

    // Test for rendering:
    // private _data = [
    //     10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0,
    //     10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0,
    //     // 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0,
    //     // 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0, 10.0, 5.0,
    // ]

    private _statsMin: number = 0;
    private _statsMax: number = 0;
    private _statsLatest: number = 0;

    get width(): number {
        return this._width;
    }

    @Input()
    set width(value: number) {
        this._width = value;
    }

    get height(): number {
        return this._height;
    }

    @Input()
    set height(value: number) {
        this._height = value;
    }

    @Input()
    set min(value: number) {
        this._min = value;
    }

    get unit(): string {
        return this._unit;
    }

    @Input()
    set unit(value: string) {
        this._unit = value;
    }

    @Input()
    set data(value: number[]) {
        this._data = value;
        this._refreshEvent$.next()
    }

    get statsMin(): number {
        return this._statsMin;
    }

    get statsMax(): number {
        return this._statsMax;
    }

    get statsLatest(): number {
        return this._statsLatest;
    }

    constructor() {
    }

    public ngOnInit(): void {
        this._refreshEvent$
            .pipe(
                debounceTime(50),
            )
            .subscribe(_ => {
                this.analyze();
                this.draw();
            });
    }

    public ngAfterViewInit() {
        const canvas = this._canvasRef.nativeElement;

        canvas.style.pointerEvents = 'none';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.overflow = 'hidden';
        canvas.width = this._width * window.devicePixelRatio;
        canvas.height = this._height * window.devicePixelRatio;
        canvas.style.width = `${this._width}px`;
        canvas.style.height = `${this._height}px`;

        this._context = canvas.getContext('2d');
        this._context.fillStyle = '#00145a';
        this._context.fillRect(0, 0, this._width, this._height);

        this._refreshEvent$.next()
    }

    private analyze(): void {
        if (this._data.length > this._width) {
            this._data = this._data.slice(this._data.length - this._width);
        }
        const max = this._data.reduce((max: number, val: number) => (max == null || (val != null && val > max)) ? val : max, null)
        this._data = this._data.map(time => time == null ? null : max < 10 ? +time.toFixed(1) : Math.round(time));

        this._statsMin = this._data.reduce((max: number, val: number) => (max == null || (val != null && val < max)) ? val : max, null);
        this._statsMax = this._data.reduce((max: number, val: number) => (max == null || (val != null && val > max)) ? val : max, null);
        this._statsLatest = this._data.length > 0 ? this._data[this._data.length - 1] : null;
    }

    private draw(): void {
        if (this._context == null) {
            return;
        }

        this._context.scale(window.devicePixelRatio, window.devicePixelRatio);
        this._context.fillStyle = '#00145a';
        this._context.fillRect(0, 0, this._width, this._height);
        this._context.globalAlpha = 1.0;

        const len = this._data.length;
        const min = this._min == null ?  this._statsMin : this._min;
        let max = this._statsMax;
        if (max == min) {
            max = min + 1;
        }
        const top = this._height;
        const f = top / (max - min);
        let offset = this._width - len;

        this._context.beginPath();
        this._context.lineWidth = 1;
        this._context.strokeStyle = '#51c6fa';
        this._data.forEach((value, i) => {
            if (value != null) {
                const x = (i + offset) + 0.5;
                const v = (value - min) * f;
                this._context.moveTo(x, top);
                this._context.lineTo(x, top - v);
            }
        })
        this._context.stroke();



    }
}
