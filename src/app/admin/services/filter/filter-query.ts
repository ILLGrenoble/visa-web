import {FilterAttribute} from './filter-attribute.model';
import {FilterParameter} from './filter-parameter.model';

export class FilterQuery {

    private attributes = new Map<string, FilterAttribute>();

    private parameters: FilterParameter[] = [];

    private fixedQueries: string[] = [];

    constructor(attributes: Map<string, FilterAttribute>) {
        this.attributes = attributes;
    }

    public setParameter(name: string, value: any): FilterQuery {
        this.parameters.push(new FilterParameter(name, value));
        return this;
    }

    public addFixedQuery(query: string): void {
        this.fixedQueries.push(query);
    }

    public execute(): { query: string; parameters: { name: string; value: string }[] } {
        const dynamicQueries = this.parameters.map((parameter) => {
            const attribute = this.attributes.get(parameter.name);
            if (attribute) {
                return `${attribute.alias} ${attribute.comparator} :${attribute.placeholder}`;
            } else {
                return null;
            }
        }).filter(value => value != null);

        return {
            query: dynamicQueries.concat(this.fixedQueries).join(' AND '),
            parameters: this.parameters.map((parameter) => {
                const attribute = this.attributes.get(parameter.name);
                if (attribute) {
                    const {placeholder} = attribute;
                    const {value} = parameter;
                    return {name: placeholder, value: value.toString()};
                }
            }).filter(value => value != null),
        };
    }
}
