const GraphObject = require("./GraphObject");
const _ = require("lodash");

class GraphEnum extends GraphObject {
    constructor() {
        super();
        this.values = null;
    }

    getValues() {
        return this.values;
    }

    setValues(values) {
        if (!values || !_.isArray(values) || !_.every(values, _.isString)) {
            throw new Error(`setValues on graphql enum expect an array of string`);
        }
        this.values = values;
    }

    isComplete() {
        return super.isComplete() && this.getValues();
    }
}

module.exports = GraphEnum;
