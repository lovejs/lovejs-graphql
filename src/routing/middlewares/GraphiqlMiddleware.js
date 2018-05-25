const _ = require("lodash");
const { graphiqlKoa } = require("apollo-server-koa");
const { Middleware } = require("@lovejs/components/middlewares");

class GraphiqlMiddleware extends Middleware {
    getOptionsSchema() {
        return {
            oneOf: [
                { type: "string" },
                {
                    type: "object",
                    properties: {
                        endpointURL: { type: "string" }
                    },
                    required: ["endpointURL"]
                }
            ]
        };
    }

    normalizeOptions(options) {
        options = super.normalizeOptions(options);

        if (_.isString(options)) {
            return { endpointURL: options };
        }

        return options;
    }

    async getMiddleware(options) {
        return graphiqlKoa(options);
    }
}

module.exports = GraphiqlMiddleware;
