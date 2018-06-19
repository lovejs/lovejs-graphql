const GraphObject = require("./GraphObject");
const _ = require("lodash");

class GraphInput extends GraphObject {
    constructor() {
        super();
        this.properties = null;
    }

    setProperties(properties) {
        if (!properties || !_.isPlainObject(properties) || !_.every(properties, p => _.isString(p))) {
            throw new Error(`setProperties on graphql input expect an object containing properties as string`);
        }
        this.properties = properties;
    }

    getProperties() {
        return this.properties;
    }

    isComplete() {
        return super.isComplete() && this.getProperties();
    }
}

module.exports = GraphInput;
