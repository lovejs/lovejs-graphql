const GraphObject = require("./GraphObject");
const _ = require("lodash");

class GraphInterface extends GraphObject {
    constructor() {
        super();
        this.properties = null;
    }

    setProperties(properties) {
        if (!properties || _.isPlainObject(properties) || !_.every(properties, _.isString)) {
            throw new Error(`setProperties on graphql interface expect an object containing properties`);
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

module.exports = GraphInterface;
