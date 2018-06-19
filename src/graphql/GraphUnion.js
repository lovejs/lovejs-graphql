const GraphObject = require("./GraphObject");
const _ = require("lodash");

class GraphUnion extends GraphObject {
    constructor() {
        super();
        this.types = null;
        this.resolver = null;
    }

    setTypes(types) {
        if (!types || !_.isArray(types) || !_.every(types, p => _.isString(p))) {
            throw new Error(`setTypes on graphql enum expect an array of type as string`);
        }

        this.types = types;
    }

    getTypes() {
        return this.types;
    }

    setResolverType(resolver) {
        if (!resolver || !_.isFunction(resolver)) {
            throw new Error(`setResolverType on graphql union or mutation expect a function`);
        }
        this.resolver = resolver;
    }

    getResolverType() {
        return this.resolver;
    }

    isComplete() {
        return super.isComplete() && this.getTypes() && this.getResolverType();
    }
}

module.exports = GraphUnion;
