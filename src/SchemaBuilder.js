const _ = require("lodash");
const { makeExecutableSchema } = require("graphql-tools");
const { GraphInput, GraphType } = require("./graphql");
const compose = require("koa-compose");

class SchemaBuilder {
    constructor(
        { types, inputs, enums, unions, queries, mutations, interfaces, scalars = {} },
        extensions = [],
        middlewares = {},
        { indentation = "    ", formatters = {} } = {}
    ) {
        this.types = types;
        this.inputs = inputs;
        this.enums = enums;
        this.unions = unions;
        this.interfaces = interfaces;
        this.queries = queries;
        this.mutations = mutations;
        this.scalars = scalars;
        this.extensions = extensions;
        this.middlewares = middlewares;
        this.indentation = indentation;
        this.formatters = formatters;

        this.loaded = false;

        _.defaults(this.formatters, {
            type: type => this.schemaType(type),
            input: input => this.schemaInput(input),
            query: query => this.schemaQuery(query),
            mutation: mutation => this.schemaMutation(mutation),
            enum: _enum => this.schemaEnum(_enum),
            union: union => this.schemaUnion(union),
            interface: _interface => this.schemaInterface(_interface)
        });
    }

    schemaType(type) {
        return (
            `\ntype ${type.getName()} ${this.schemaTypeInterfaces(type.getInterfaces())} {\n` +
            this.schemaProperties(type.getProperties()) +
            `\n}`
        );
    }

    schemaTypeInterfaces(interfaces) {
        if (!interfaces) {
            return "";
        } else if (_.isString(interfaces)) {
            return _.trim(interfaces) !== "" ? `implements ${interfaces}` : "";
        } else if (_.isArray(interfaces)) {
            return interfaces.length > 0 ? `implements ${interfaces.join(", ")}` : "";
        } else {
            throw new Error(`Invalid interfaces. String or array of string expected`);
        }
    }

    schemaInterface(_interface) {
        return `\ninterface ${_interface.getName()} {` + this.schemaProperties(_interface.getProperties()) + `}`;
    }

    schemaEnum(_enum) {
        return `\nenum ${_enum.getName()} {\n` + this.schemaValues(_enum.getValues()) + `\n}`;
    }

    schemaQuery(query) {
        return `${query.getName()} ${this.schemaQueryInput(query.getInput())}:${this.schemaQueryOutput(query.getOutput())}`;
    }

    schemaInput(input) {
        return `\ninput ${input.getName()} {\n` + this.schemaProperties(input.getProperties()) + `\n}`;
    }

    schemaUnion(union) {
        return `\nunion ${union.getName()} = ${union.getTypes().join(" | ")}\n`;
    }

    schemaQueryInput(input) {
        if (!input) {
            return "";
        } else {
            if (input instanceof GraphInput) {
                return `(input: ${input.getName()})`;
            } else {
                return `(${this.schemaProperties(input, ", ")})`;
            }
        }
    }

    schemaQueryOutput(output) {
        if (output instanceof GraphType) {
            return output.getName();
        } else {
            return output;
        }
    }

    schemaMutation(mutation) {
        return this.schemaQuery(mutation);
    }

    schemaProperties(properties, sep = "\n") {
        if (_.isString(properties)) {
            return properties;
        } else if (_.isPlainObject(properties)) {
            let schema = [];
            _.map(properties, (definition, property) => {
                if (_.isString(definition)) {
                    if (sep === "\n") {
                        const rule = {
                            pattern: "/[a-z]+/",
                            required: true
                        };
                        //schema.push(`${sep == "\n" ? this.indentation : ""}# ${JSON.stringify(rule)}`);
                    }
                    schema.push(`${sep == "\n" ? this.indentation : ""}${property}: ${definition}`);
                } else if (_.isPlainObject(definition)) {
                    let { input, output } = definition;
                    input = input ? this.schemaQueryInput(input) : "";
                    schema.push(`${this.indentation}${property}${input}: ${output}`);
                }
            });

            return schema.join(sep);
        } else {
            throw new Error(`Invalid properties supplied. String or plain object expected.`);
        }
    }

    schemaValues(values, sep = "\n") {
        if (_.isString(values)) {
            return values;
        } else if (_.isArray(values)) {
            return values.map(v => `${this.indentation} ${v}`).join(sep);
        } else {
            throw new Error(`Invalid values supplied. String or array of strings expected.`);
        }
    }

    getMiddleware(name, args) {
        if (!this.middlewares[name]) {
            throw new Error(`Invalid graphql middleware specified ${name}`);
        }

        const middleware = this.middlewares[name];

        if (args && !_.isArray(args)) {
            args = [args];
        }

        if (_.isFunction(middleware)) {
            return middleware.apply(null, args);
        } else {
            return middleware.getMiddleware.apply(null, args);
        }
    }

    async computeResolver(operation) {
        const m = operation.getMiddlewares();
        let middlewares = [];
        for (let name in m) {
            const args = m[name];
            middlewares.push(this.getMiddleware(name, args));
        }
        middlewares.push(operation.getResolver());

        const wrapMiddleware = fn => {
            return (context = {}, next) => {
                const args = (context.args || []).concat(next);
                return fn.apply(this, args);
            };
        };

        middlewares = middlewares.map(wrapMiddleware);
        const composed = compose(middlewares);

        return async function(...args) {
            return composed.call(this, { args });
        };
    }

    async registerTypes(typeDefs, resolvers) {
        for (let type of this.types) {
            try {
                typeDefs.push(this.formatters.type(type));
                if (type.getResolvers()) {
                    resolvers[type.getName()] = type.getResolvers();
                }
            } catch (e) {
                throw new Error(`Error resolving graphql type ${type.getName()} ${e.message}`);
            }
        }
    }

    registerInterfaces(typeDefs) {
        for (let _interface of this.interfaces) {
            try {
                typeDefs.push(this.formatters.interface(_interface));
            } catch (e) {
                throw new Error(`Error resolving graphql interface ${_interface.getName()} ${e.message}`);
            }
        }
    }

    registerEnums(typeDefs) {
        for (let _enum of this.enums) {
            try {
                typeDefs.push(this.formatters.enum(_enum));
            } catch (e) {
                throw new Error(`Error resolving graphql enum ${_enum.getName()} ${e.message}`);
            }
        }
    }

    registerUnions(typeDefs, resolvers) {
        for (let union of this.unions) {
            try {
                typeDefs.push(this.formatters.union(union));
                resolvers[union.getName()] = {
                    __resolveType: union.getResolverType()
                };
            } catch (e) {
                throw new Error(`Error resolving graphql union ${union.getName()} ${e.message}`);
            }
        }
    }

    registerInputs(typeDefs) {
        for (let input of this.inputs) {
            try {
                typeDefs.push(this.formatters.input(input));
            } catch (e) {
                throw new Error(`Error resolving graphql input ${input.getName()} ${e.message}`);
            }
        }

        for (let operation of _.concat(this.queries, this.mutations)) {
            if (operation.getInput() instanceof GraphInput) {
                try {
                    const input = operation.getInput();
                    typeDefs.push(this.formatters.input(input));
                } catch (e) {
                    throw new Error(
                        `Error resolving graphql input ${input.getName()} from query or mutation ${operation.getName()} ${e.message}`
                    );
                }
            }
            if (operation.getOutput() instanceof GraphType) {
                try {
                    const output = operation.getOutput();
                    typeDefs.push(this.formatters.type(output));
                } catch (e) {
                    throw new Error(
                        `Error resolving graphql output ${output.getName()} from query or mutation ${operation.getName()} ${e.message}`
                    );
                }
            }
        }
    }

    registerScalars(typeDefs, resolvers) {
        for (let name in this.scalars) {
            const resolver = this.scalars[name];
            try {
                typeDefs.push(`scalar ${name}`);
                resolvers[name] = resolver;
            } catch (e) {
                throw new Error(`Error resolving graphql scalar ${name} ${e.message}`);
            }
        }
    }

    async registerQueries(typeDefs, resolvers) {
        if (this.queries.length > 0) {
            typeDefs.push(`\ntype Query {`);
            resolvers.Query = {};
            for (let query of this.queries) {
                try {
                    typeDefs.push(`${this.indentation}${this.formatters.query(query)}`);
                    resolvers.Query[query.getName()] = await this.computeResolver(query);
                } catch (e) {
                    throw new Error(`Error resolving graphql query ${query.getName()} ${e.message}`);
                }
            }

            typeDefs.push(`}`);
        }
    }

    async registerMutations(typeDefs, resolvers) {
        if (this.mutations.length > 0) {
            typeDefs.push(`\ntype Mutation {`);
            resolvers.Mutation = {};
            for (let mutation of this.mutations) {
                try {
                    typeDefs.push(`${this.indentation}${this.formatters.mutation(mutation)}`);
                    resolvers.Mutation[mutation.getName()] = await this.computeResolver(mutation);
                } catch (e) {
                    throw new Error(`Error resolving graphql mutation ${mutation.getName()} ${e.message}`);
                }
            }
            typeDefs.push(`}`);
        }
    }

    async registerExtensions() {
        if (this.loaded) {
            return;
        }
        this.loaded = true;
        for (let extension of this.extensions) {
            await extension.registerObjects();
            this.types = _.concat(this.types, extension.getTypes());
            this.interfaces = _.concat(this.interfaces, extension.getInterfaces());
            this.enums = _.concat(this.enums, extension.getEnums());
            this.queries = _.concat(this.queries, extension.getQueries());
            this.mutations = _.concat(this.mutations, extension.getMutations());
            this.inputs = _.concat(this.inputs, extension.getInputs());
            this.unions = _.concat(this.unions, extension.getUnions());
        }
    }

    async getTypesAndResolvers() {
        let typeDefs = [];
        let resolvers = {};

        await this.registerExtensions();
        this.registerScalars(typeDefs, resolvers);

        this.registerEnums(typeDefs);
        this.registerInterfaces(typeDefs);
        this.registerInputs(typeDefs);
        this.registerUnions(typeDefs, resolvers);

        await this.registerTypes(typeDefs, resolvers);

        await this.registerQueries(typeDefs, resolvers);
        await this.registerMutations(typeDefs, resolvers);

        return { typeDefs: typeDefs.join("\n"), resolvers };
    }

    async getGraphqlSchema() {
        const { typeDefs, resolvers } = await this.getTypesAndResolvers();
        const logger = {
            log: e => {
                console.log(e);
            }
        };

        try {
            return makeExecutableSchema({ typeDefs, resolvers, logger });
        } catch (e) {
            console.log(e);
            throw new Error(`Error creating graphql schema: ${e.message}`);
        }
    }
}

module.exports = SchemaBuilder;
