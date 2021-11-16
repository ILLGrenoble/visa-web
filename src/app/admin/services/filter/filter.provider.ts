import { FilterAttribute } from './filter-attribute.model';
import { FilterQuery } from './filter-query';

export class FilterProvider {

    private attributes = new Map<string, FilterAttribute>();

    constructor(attributes: { [key: string]: FilterAttribute }) {
        Object.entries(attributes).forEach(
            ([key, value]) => {
                if (!this.attributes.has(key)) {
                    this.attributes.set(key, value);
                }
            },
        );
    }

    public createQuery(): FilterQuery {
        return new FilterQuery(this.attributes);
    }

}
