import { Server } from "./server";





const runServer = async () => {
    const server = new Server();
    await server.listen("127.0.0.1", 4221)

}

runServer()