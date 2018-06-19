const { Plugin } = require("@lovejs/framework");
const _ = require("lodash");

class GraphqlPlugin extends Plugin {
    async registerServices(container, origin) {
        container.setParameter("graphql.logger.service", `logger.${this.get("logger", "default")}`);
        const uploadOptions = this.get("upload");
        _.defaults(uploadOptions, {
            maxFieldSize: 1000,
            maxFileSize: 1000,
            maxFiles: 5
        });
        container.setParameter("graphql.upload.options", uploadOptions || {});
        await container.loadDefinitions(__dirname + "/_framework/services/services.yml", origin);
        if (this.hasPlugin('cupidon')) {
            await container.loadDefinitions(__dirname + "/_framework/services/cupidon.yml", origin);
        }
    }
}

module.exports = GraphqlPlugin;
