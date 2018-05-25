const GraphObject = require("./GraphObject");
const GraphInterface = require("./GraphInterface");
const GraphEnum = require("./GraphEnum");
const GraphType = require("./GraphType");
const GraphInput = require("./GraphInput");
const GraphQuery = require("./GraphQuery");
const GraphMutation = require("./GraphMutation");

const _ = require("lodash");

class GraphExtension {
    constructor() {
        this.enums = [];
        this.interfaces = [];
        this.types = [];
        this.queries = [];
        this.mutations = [];
        this.inputs = [];
        this.ownMiddlewares = {};
        this.current = false;
    }

    async registerObjects() {}

    getMiddlewares() {
        return this.ownMiddlewares;
    }

    getEnums() {
        return this.enums;
    }

    getInterfaces() {
        return this.interfaces;
    }

    getTypes() {
        return this.types;
    }

    getInputs() {
        return this.inputs;
    }

    getQueries() {
        return this.queries;
    }

    getMutations() {
        return this.mutations;
    }

    addEnum(name) {
        return this.add(new GraphEnum(), name);
    }

    addInterface(name) {
        return this.add(new GraphInterface(), name);
    }

    addType(name) {
        return this.add(new GraphType(), name);
    }

    addInput(name) {
        return this.add(new GraphInput(), name);
    }

    addQuery(name) {
        return this.add(new GraphQuery(), name);
    }

    addMutation(name) {
        return this.add(new GraphMutation(), name);
    }

    add(instance, name) {
        if (!(instance instanceof GraphObject)) {
            throw new Error(`Attempt to add a non graphql object to the schema extension`);
        }

        if (this.current && !this.current.isComplete()) {
            throw new Error(`Attempt to add anoter graphql object while current one is incomplete`);
        }

        if (name instanceof GraphObject) {
            instance = name;
        } else {
            instance.setName(name);
            this.current = instance;
        }

        if (instance instanceof GraphEnum) {
            this.enums.push(instance);
        } else if (instance instanceof GraphInterface) {
            this.interfaces.push(instance);
        } else if (instance instanceof GraphType) {
            this.types.push(instance);
        } else if (instance instanceof GraphQuery) {
            instance.setMiddlewares(this.getMiddlewares());
            this.queries.push(instance);
        } else if (instance instanceof GraphMutation) {
            instance.setMiddlewares(this.getMiddlewares());
            this.mutations.push(instance);
        } else if (instance instanceof GraphInput) {
            this.inputs.push(instance);
        } else {
            throw new Error(`Invalid instance provided to schemaExtension`);
        }

        return this;
    }

    callMethod(method, args) {
        if (!this.current) {
            throw new Error(
                `Attempt to call method ${method} while their is no current grapqhl object. You must call addEnum, addInterface, addType, addQuery or addMutation before`
            );
        }

        if (!this.current[method] || !_.isFunction(this.current[method])) {
            throw new Error(`Graphql objects of type ${this.current.constructor.name} don't support method ${method}`);
        }

        this.current[method](...args);
        return this;
    }

    properties() {
        return this.callMethod("setProperties", arguments);
    }

    values() {
        return this.callMethod("setValues", arguments);
    }

    interfaces() {
        return this.callMethod("setInterfaces", arguments);
    }

    input(properties, dedicatedType = false, name = false) {
        let input = properties;
        if (dedicatedType) {
            input = new GraphInput();
            input.setName(name ? name : `${this.current.getName()}Input`);
            input.setProperties(properties);
        }

        return this.callMethod("setInput", [input]);
    }

    output(properties, dedicatedType = false, name = false) {
        let output = properties;
        if (dedicatedType) {
            output = new GraphType();
            output.setName(name ? name : `${this.current.getName()}Output`);
            output.setProperties(properties);
        }

        return this.callMethod("setOutput", [output]);
    }

    resolver() {
        return this.callMethod("setResolver", arguments);
    }

    resolvers() {
        return this.callMethod("setResolvers", arguments);
    }

    middlewares() {
        return this.callMethod("setMiddlewares", arguments);
    }
}

module.exports = GraphExtension;
