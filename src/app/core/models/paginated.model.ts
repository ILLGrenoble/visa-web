/**
 * A generic class for dealing with paginated API responses
 */
export class Paginated<T> implements Iterable<T> {

    private _page: number = undefined;
    private _count: number = undefined;
    private _limit: number = undefined;
    private _lastPage: number = undefined;
    private _firstItem: number = undefined;
    private _lastItem: number = undefined;
    private _items = [];
    private _errors: string[] = undefined;

    get page(): number {
        return this._page;
    }

    set page(value: number) {
        this._page = value;
    }

    get count(): number {
        return this._count;
    }

    set count(value: number) {
        this._count = value;
    }

    get limit(): number {
        return this._limit;
    }

    set limit(value: number) {
        this._limit = value;
    }

    get lastPage(): number {
        return this._lastPage;
    }

    set lastPage(value: number) {
        this._lastPage = value;
    }

    get firstItem(): number {
        return this._firstItem;
    }

    set firstItem(value: number) {
        this._firstItem = value;
    }

    get lastItem(): number {
        return this._lastItem;
    }

    set lastItem(value: number) {
        this._lastItem = value;
    }

    get items(): any[] {
        return this._items;
    }

    set items(value: any[]) {
        this._items = value;
    }

    get errors(): string[] {
        return this._errors;
    }

    set errors(value: string[]) {
        this._errors = value;
    }

    constructor(count: number, page: number, limit: number, items: T[], errors?: string[]) {
        this._count = count;
        this._page = page;
        this._limit = limit;
        this._items = items;
        this._errors = errors;
        this._lastPage = Math.ceil(count / limit);
        this._firstItem = (page - 1) * limit + 1;
        this._lastItem = (this._count > (page * limit)) ? (page * limit) : this._count;
    }

    public [Symbol.iterator](): { next(): IteratorResult<T> } {
        let pointer = 0;
        const items = this._items;
        return {
            next(): IteratorResult<T> {
                if (pointer < items.length) {
                    return {
                        done: false,
                        value: items[pointer++],
                    };
                } else {
                    return {
                        done: true,
                        value: null,
                    };
                }
            },
        };
    }

}
