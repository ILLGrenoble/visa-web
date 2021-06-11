import {FilterAttribute} from './filter-attribute.model';
import {FilterParameter} from './filter-parameter.model';

export class FilterQuery {

    private attributes = new Map<string, FilterAttribute>();

    private parameters: FilterParameter[] = [];

    constructor(attributes: Map<string, FilterAttribute>) {
        this.attributes = attributes;
    }

    public setParameter(name: string, value: any): FilterQuery {
        this.parameters.push(new FilterParameter(name, value));
        return this;
    }

    public execute(): { query: string; parameters: { name: string; value: string }[] } {
        return {
            query: this.parameters.map((parameter) => {
                const attribute = this.attributes.get(parameter.name);
                if (attribute) {
                    return `${attribute.alias} ${attribute.comparator} :${attribute.placeholder}`;
                }
            }).join(' AND '),
            parameters: this.parameters.map((parameter) => {
                const attribute = this.attributes.get(parameter.name);
                if (attribute) {
                    const {placeholder} = attribute;
                    const {value} = parameter;
                    return {name: placeholder, value: value.toString()};
                }
            }),
        };
    }
}
