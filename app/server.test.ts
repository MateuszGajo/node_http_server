import { Server } from "./server";
import net from 'net';

describe("", () => {

    it("test main path", async () => {
        console.log("start test??")
        const server = new Server();
        await server.listen("127.0.0.1", 4223);
        const data = await new Promise((resolve, reject) => {
            const socket = net.connect({ host: "127.0.0.1", port: 4223 }, () => {
                socket.write("GET / HTTP/1.1\r\n\r\n");
            });

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

        expect(data).toContain('HTTP/1.1 200 OK');

        try {
            await server.close()
            console.log("closing success")
        } catch (err) {
            console.log("closing error?", err)
        }
    })
})