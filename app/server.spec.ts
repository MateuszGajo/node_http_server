import { Server } from "./server";
import net from 'net';
import * as fs from 'fs';
import { Encoding, EncodingEnum } from "./encoding";
import { Parser } from "./parser";


const getData = (socket: net.Socket): Promise<Buffer> => new Promise((resolve, reject) => {

    let response = Buffer.alloc(0);

    socket.on('data', (chunk: Buffer) => {
        response = chunk
        resolve(chunk)
    });

    socket.on('end', () => {
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
        socket.end()
        socket.destroy();
    })
    it("Should return 200 ok when default path", async () => {
        socket.write("GET / HTTP/1.0\r\n\r\n");
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 200 OK');
    })

    it("Should return 404 not found on not defined path", async () => {
        socket.write("GET /sasa HTTP/1.0\r\n\r\n");
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 404 Not Found');
    })

    it("Should return echo path value with headers", async () => {
        socket.write("GET /echo/abc HTTP/1.0\r\n\r\n");
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 200 OK\r\n');
        expect(data).toContain('Content-Type: text/plain');
        expect(data).toContain('Content-Length: 3');
        expect(data).toContain('\r\n\r\nabc');
    })

    it("Should return user agent", async () => {
        socket.write("GET /user-agent HTTP/1.0\r\nUser-Agent: foobar/1.2.3\r\n\r\n");
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 200 OK\r\n');
        expect(data).toContain('Content-Type: text/plain');
        expect(data).toContain('Content-Length: 12');
        expect(data).toContain('\r\n\r\nfoobar/1.2.3');
    })


    it("test concurrenct connections", async () => {
        socket.write("GET /user-agent HTTP/1.0\r\nUser-Agent: foobar/1.2.3\r\n\r\n");
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 200 OK\r\n');
        expect(data).toContain('Content-Type: text/plain');
        expect(data).toContain('Content-Length: 12');
        expect(data).toContain('\r\n\r\nfoobar/1.2.3');
    })



    it("Should stream data from file", async () => {
        const directory = "/tmp/"
        const filename = 'test'
        server.setDirectory(directory)


        fs.writeFileSync("/tmp/" + filename, "Hello, World!")
        socket.write(`GET /files/${filename} HTTP/1.0\r\n\r\n`);
        const data = String(await getData(socket));

        expect(data).toContain('HTTP/1.0 200 OK\r\n');
        expect(data).toContain('Content-Type: application/octet-stream');
        expect(data).toContain('Content-Length: 13');
        expect(data).toContain('\r\n\r\nHello, World!');
    })

    it("Should write data to file", async () => {
        const directory = "/tmp/"
        const filename = 'readTest'
        const fileData = 'test123'
        server.setDirectory(directory)


        socket.write(`POST /files/${filename} HTTP/1.0\r\n\r\n${fileData}`);
        const data = String(await getData(socket));

        const readFileData = fs.readFileSync("/tmp/" + filename)

        expect(String(readFileData)).toBe(fileData);

        expect(data).toContain('HTTP/1.0 201 Created\r\n');
    })
    it("Should encode data", async () => {
        socket.write("GET /echo/abc HTTP/1.0\r\nAccept-Encoding: gzip\r\n\r\n");
        const data = await getData(socket);
        const parser = new Parser();
        const encoding = new Encoding();
        const responseParsed = parser.parseRes(data);

        const encodingDecoded = await encoding.decode(EncodingEnum.gzip, responseParsed.body)


        expect(responseParsed.version).toContain('HTTP/1.0');
        expect(responseParsed.status).toContain('200');
        expect(responseParsed.statusMsg).toContain('OK');
        expect(responseParsed.headers['Content-Encoding']).toContain('gzip');
        expect(responseParsed.headers['Content-Length']).toContain('23');
        expect(responseParsed.headers['Content-Type']).toContain('text/plain');

        expect(String(encodingDecoded)).toBe("abc")
    })

    it("Should does not enocde when invalid header", async () => {
        socket.write("GET /echo/abc HTTP/1.0\r\nAccept-Encoding: invalid\r\n\r\n");
        const data = await getData(socket);
        const parser = new Parser();
        const responseParsed = parser.parseRes(data);

        const decoder = new TextDecoder('utf-8');
        const bodyStr = decoder.decode(responseParsed.body);

        expect(responseParsed.version).toContain('HTTP/1.0');
        expect(responseParsed.status).toContain('200');
        expect(responseParsed.statusMsg).toContain('OK');
        expect(responseParsed.headers['Content-Encoding']).toBe(undefined);
        expect(responseParsed.headers['Content-Length']).toContain('3');
        expect(responseParsed.headers['Content-Type']).toContain('text/plain');

        expect(bodyStr).toBe("abc")
    })

    it("Should connection be persitent in http 1.1 by default", async () => {
        socket.write("GET /echo/abc HTTP/1.1\r\n\r\n");
        let data = String(await getData(socket));

        expect(data).toContain('HTTP/1.1 200 OK\r\n');
        expect(data).toContain('Content-Type: text/plain');
        expect(data).toContain('Content-Length: 3');
        expect(data).toContain('\r\n\r\nabc');

        socket.write("GET /echo/abc HTTP/1.1\r\n\r\n");
        data = String(await getData(socket));

        expect(data).toContain('HTTP/1.1 200 OK\r\n');
        expect(data).toContain('Content-Type: text/plain');
        expect(data).toContain('Content-Length: 3');
        expect(data).toContain('\r\n\r\nabc');
    })



})