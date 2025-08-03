import net from 'net';
import { Parser } from './parser';
import { Router } from './router';
export class Server {
    private server?: net.Server;
    listen(address: string, port: number) {
        return new Promise((res, rej) => {
            this.server = net.createServer((socket) => {

                socket.on('data', (chunk) => {
                    const parser = new Parser();
                    const request = parser.parse(chunk)

                    const router = new Router();

                    router.addHandler("/", "GET", (req, resp, ctx) => {
                        resp.status(200).send();
                    })

                    router.addHandler("/echo/{str}", "GET", (req, resp, ctx) => {
                        const echoStr = req.pathParam.str;
                        resp.status(200).text(echoStr).send();
                    })

                    try {
                        router.handleRequest(request, socket)
                    } catch (err) {
                        console.log(err)
                        socket.end();
                        process.exit(0)
                    }
                })
                socket.on("close", () => {
                    socket.end();
                })

            })

            this.server.on("error", (err) => rej(err))
            this.server.listen(port, address, () => {
                res("")
            });
        })

    }

    close() {
        return new Promise<void>((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) reject(err);
                else resolve()
            });
        });
    }
}