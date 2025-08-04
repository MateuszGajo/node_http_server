import net from 'net';
import { Parser } from './parser';
import { Router } from './router';
import * as fs from 'fs';

export interface ServerContext {

    directory: string
}
export class Server {
    private server?: net.Server;
    private directory: string
    listen(address: string, port: number) {
        return new Promise((res, rej) => {
            this.server = net.createServer((socket) => {

                socket.on('data', (chunk) => {

                    const parser = new Parser();
                    const request = parser.parseReq(chunk)

                    const router = new Router();

                    router.addHandler("/", "GET", (req, resp, ctx) => {
                        resp.status(200).send();
                    })

                    router.addHandler("/echo/{str}", "GET", (req, resp, ctx) => {
                        const echoStr = req.pathParam.str;
                        resp.status(200).text(echoStr).send();
                    })

                    router.addHandler("/user-agent", "GET", (req, resp, ctx) => {
                        const userAgent = req.headers['User-Agent'];
                        resp.status(200).text(userAgent).send();
                    })

                    router.addHandler("/files/{filename}", "GET", (req, resp, ctx) => {
                        const filename = req.pathParam['filename']
                        const directory = ctx.directory;

                        fs.readFile(directory + filename, (err, data) => {
                            if (err) {
                                resp.status(404).send();
                                return;
                            }

                            resp.setHeader("Content-Type", "application/octet-stream")
                            resp.status(200).text(String(data)).send()
                        })

                    })

                    router.addHandler("/files/{filename}", "POST", (req, resp, ctx) => {
                        const filename = req.pathParam['filename']
                        const directory = ctx.directory;

                        const decoder = new TextDecoder('utf-8');
                        const body = decoder.decode(req.body);

                        fs.writeFile(directory + filename, String(body), (err) => {
                            if (err) {
                                return resp.status(500).send();
                            }
                            resp.status(201).send()

                        })

                    })

                    const context: ServerContext = {
                        directory: this.directory
                    }
                    try {
                        router.handleRequest(request, socket, context)
                    } catch (err) {
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

    setDirectory(directory: string) {
        this.directory = directory
    }
}