import { Server } from "./server";
import net from 'net';


const getData = (socket: net.Socket) => new Promise((resolve, reject) => {

    let response = '';

    socket.on('data', chunk => {
        response += chunk.toString();
    });

    socket.on('end', () => {
        socket.end()
        socket.destroy();
        resolve(response);
    });

    socket.on('error', err => {
        socket.end()
        socket.destroy()
        reject(err);
    });
});


describe("E2E", () => {
    let server: Server;
    let socket: net.Socket;
    beforeEach(async () => {
        server = new Server();
        await server.listen("127.0.0.1", 4223);
        socket = net.connect({ host: "127.0.0.1", port: 4223 });

    })
    afterEach(() => {
        server.close()
    })
    it("Should return 200 ok when default path", async () => {
        socket.write("GET / HTTP/1.1\r\n\r\n");
        const data = await getData(socket);

        expect(data).toContain('HTTP/1.1 200 OK');
    })

    it("Should return 404 not found on not defined path", async () => {
        socket.write("GET /sasa HTTP/1.1\r\n\r\n");
        const data = await getData(socket);

        expect(data).toContain('HTTP/1.1 404 Not Found');
    })


})