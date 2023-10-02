// AST based on acorn using https://astexplorer.net/
// with slight changes/alterations

import ArgumentsParser from "./args";
import Lexer from "./lexer/lexer";
import Parser from "./parser/parser";
import Token from "./lexer/Token";

function run(file_path: string, src: string, args: ArgumentsParser) {
    const lexer = new Lexer(file_path, src);

    const tokens: Token[] = [];
    for (;;) { 
        const token: Token | null = lexer.next_token();
        if (!token) break;
        tokens.push(token); 
        // console.log(token.toString())
    }

    const parser = new Parser(tokens);
    const program = parser.parse();
    if (!program) {
        console.error(`Failed to parse/run the program!`);
        return;
    }

    const printJson = !!args.get("json");
    if (!printJson) 
        console.dir(program, { depth: null });
    else 
        console.log(JSON.stringify(program, null, 4));
}

export let DEBUG_MODE = false;

async function main_bun(inputFile: string | null, args: ArgumentsParser) {
    if (!inputFile) 
        return console.error("[index.ts::main_bun] No input file was provided.");

    if (!('Bun' in globalThis))
        return console.error("[index.ts::main_bun] Bun was not found in globalThis which is odd!")

    if (!('Buffer' in globalThis)) 
        return console.error("[index.ts::main_bun] To run this, please provide a Buffer class with either npm or use Bun/Deno.");

    const Bun = (globalThis as any)['Bun']!;
    const Buffer = (globalThis as any)['Buffer']!;
    const process = (globalThis as any)['process']!;

    const useRepl = !!args.get("repl");

    if (useRepl) {
        process.stdout.write("> ");
        for await (const chunk of Bun.stdin.stream()) {
            const chunkText = Buffer.from(chunk).toString();
            if (chunkText.toLowerCase().trim() == 'exit') {
                process.exit(0);
                return;
            }

            const lexer = new Lexer("null", chunkText);
            const parser = new Parser(lexer);
            const program = parser.parse();
            console.log(JSON.stringify(program, null, 4) + "\n");
            process.stdout.write("> ");
        }
    }

    const input = Bun.file(inputFile);
    const src = await input.text();
    run(inputFile, src, args)       
}

async function main_deno(inputFile: string | null, args: ArgumentsParser) {
    if (!inputFile) 
        return console.error("[index.ts::main_deno] No input file was provided.");
    
    if (!('Deno' in globalThis))
        return console.error("[index.ts::main_deno] Deno was not found in globalThis which is odd!")

    console.error("[index.ts::main_deno] TODO: Deno stuff")
}

async function main() {
    console.clear();

    let _args: string[] = [];
    if (!('Bun' in globalThis) && !('Deno' in globalThis)) {
        const process = (globalThis as any)['process'];
        _args = process.argv.slice(2, process.argv.length);
    } else if ('Bun' in globalThis) {
        const Bun = (globalThis as any)['Bun'];
        _args = Bun.argv.slice(2, Bun.argc);
    } else if ('Deno' in globalThis) {
        const Deno = (globalThis as any)['Deno'];
        _args = [...Deno.args]
    }

    const args = new ArgumentsParser(_args);
    if (!args.parse()) {
        console.error("ERROR: Failed to parse arguments..");
        return;
    }

    let inputFile: string | null = null;
    if (args.has("input")) {
        const input = args.get("input")!;
        inputFile = input.value || null;
    } else {
        for (let i = 0; i < args.length; ++i) {
            const arg = args.get(i);
            if (arg && arg.name == null) {
                inputFile = arg.value;
                break;
            }
        }
    }

    if ('Bun' in globalThis)
        return main_bun(inputFile, args);

    else if ('Deno' in globalThis)
        return main_deno(inputFile, args);

    else { // NODE
        const useRepl = !!args.get("repl");

        // NODEJS
        if (useRepl) 
            return console.error("[index.ts] TODO: repl using npm");

        if (inputFile) {
            console.error('TODO: node support')
        } else
            console.error("[index.ts::main] No input file was provided.")
    }
}

main();
