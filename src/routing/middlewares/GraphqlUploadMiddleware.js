const { processRequest } = require("apollo-upload-server");
const { Middleware } = require("@lovejs/components/middlewares");

class GraphqlUploadMiddleware extends Middleware {
    getOptionsSchema() {
        return {
            oneOf: [{ type: "null" }, { type: "object" }]
        };
    }

    getMiddleware(options) {
        return async (ctx, next) => {
            if (ctx.request.is("multipart/form-data")) {
                try {
                    return processRequest(ctx.request, options)
                        .then(body => {
                            ctx.request.body = body;
                            return next();
                        })
                        .catch(error => {
                            if (error.status && error.expose) response.status(error.status);
                            return ctx.serverError(error.message);
                        });
                } catch (e) {
                    console.log("Captured ! ", e);
                }
            } else {
                return await next();
            }
        };
    }
}

module.exports = GraphqlUploadMiddleware;
