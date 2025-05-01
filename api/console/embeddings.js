const { program } = require("commander");
const { v4: uuidV4 } = require("uuid");

program
    .version("0.0.1")
    .description("A command-line tool for embeddings");

program
    .command("generate <text>")
    .description("Generates embeddings given some text")
    .action((text) => {
        console.log(console.log(text));
    });

program.parse(process.argv);
