import { Server } from "./server";

const runServer = async () => {
    const args = process.argv;
    let directory = '/'
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--directory' && i + 1 < args.length) {
            directory = args[i + 1]
        }
    }
    const server = new Server();
    server.setDirectory(directory);
    await server.listen("127.0.0.1", 4221)

}

runServer()