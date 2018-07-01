const { Command } = require("@lovejs/components/console");

class SchemaCommand extends Command {
    constructor(schemaBuilder) {
        super();
        this.schemaBuilder = schemaBuilder;
    }

    register(program) {
        program.command("graphql:schema:dump", "Dump the current graphql schema").action(this.execute.bind(this));
    }

    async execute() {
        const { typeDefs } = await this.schemaBuilder.getTypesAndResolvers();

        this.output(typeDefs);
    }
}

module.exports = SchemaCommand;
