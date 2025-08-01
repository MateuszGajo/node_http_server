import net from 'net';
export class Server {
    private server?: net.Server;
    listen(address: string, port: number) {
        console.log("how many times listen???")
        return new Promise((res, rej) => {
            this.server = net.createServer((socket) => {

                socket.on('data', (chunk) => {
                    // const parser = new Parser();
                    // const request = parser.parse(chunk)

                    // const router = new Router();

                    // router.addHandler("/", "GET", (req, resp, ctx) => {
                    //     resp.status(200).send();
                    // })

                    socket.write("HTTP/1.1 200 OK\r\n")
                    // socket.
                    socket.end()
                    socket.destroy()


                    // try {
                    //     router.handleRequest(request, socket)
                    // } catch (err) {
                    //     socket.end();
                    //     console.error(err);
                    //     process.exit(0)
                    // }
                })
                socket.on("close", () => {
                    socket.destroy()
                    // this.server.close()
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
            console.log("lets close server????")
            this.server.close((err) => {
                if (err) reject(err);
                else {
                    // console.log(this.server.)
                    resolve()
                }
            });
        });
    }
}