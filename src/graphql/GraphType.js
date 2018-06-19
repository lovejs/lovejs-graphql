const GraphObject = require("./GraphObject");
const _ = require("lodash");

class GraphType extends GraphObject {
    constructor() {
        super();
        this.properties = null;
        this.resolvers = null;
        this.interfaces = null;
    }

    setProperties(properties) {
        if (
            !properties ||
            !_.isPlainObject(properties) ||
            !_.every(properties, p => _.isString(p) || (_.isPlainObject(p) && _.isString(p.output)))
        ) {
            throw new Error(
                `setProperties on graphql type expect an object containing properties as string or plain object with an output string property`
            );
        }
        this.properties = properties;
    }

    getProperties() {
        return this.properties;
    }

    setResolvers(resolvers) {
        if (!resolvers || !_.isPlainObject(resolvers) || !_.every(resolvers, _.isFunction)) {
            throw new Error(`setResolvers on graphql type expect an object containing resolvers functions`);
        }
        this.resolvers = resolvers;
    }

    setResolver(property, resolver) {
        this.resolvers = { ...this.resolvers, [property]: resolver };
    }

    getResolvers() {
        return this.resolvers;
    }

    setInterfaces(interfaces) {
        if (_.isString(interfaces)) {
            interfaces = [interfaces];
        }

        if (!interfaces || !_.isArray(interfaces) || !_.every(interfaces, _.isString)) {
            throw new Error(`setInterfaces on graphql type expect a string or an array of strings`);
        }

        this.interfaces = interfaces;
    }

    getInterfaces() {
        return this.interfaces;
    }

    isComplete() {
        return super.isComplete() && this.getProperties();
    }
}

module.exports = GraphType;
