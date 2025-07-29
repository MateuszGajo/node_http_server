import * as net from "net";

interface Request {
    method: string,
    path: string,
    version: string,
    headers: Record<string, string>,
    pathParam: Record<string, string>,
    body: string;
}

class Parser {

    request: Request = {
        method: "",
        path: "",
        version: "",
        headers: {},
        pathParam: {},
        body: ""
    };

    bufferSplitByCRLF(data: Buffer<ArrayBufferLike>): Buffer<ArrayBufferLike>[] {
        let start = 0
        let el: Buffer<ArrayBufferLike>[] = []
        let i = 1
        for (i = 1; i < data.length; i++) {
            if (data[i - 1] == 13 && data[i] == 10) {
                el.push(data.subarray(start, i - 1))
                start = i + 1
            }
        }
        if (start != i) {
            el.push(data.subarray(start, i))
        }

        return el;
    }


    parse(data: Buffer<ArrayBufferLike>) {
        const bufferSplited = this.bufferSplitByCRLF(data);

        const requestLine = String(bufferSplited.shift());
        const headers: Record<string, string> = {};
        while (true) {
            let item = bufferSplited.shift()
            if (item?.length == 0) {
                break;
            }

            let keyValue = String(item).split(":").map(item => item.trim())
            headers[keyValue[0]] = keyValue[1]
        }
        const body = bufferSplited.shift();

        const requestLineSplit = requestLine.split(" ");
        if (requestLineSplit.length != 3) {
            throw new Error("request error line shoud contain method, path and version")
        }

        this.request.method = requestLineSplit[0]
        this.request.path = requestLineSplit[1]
        this.request.version = requestLineSplit[2]

        this.request.headers = headers;
        this.request.body = String(body);

        return this.request
    }
}


const server = net.createServer((socket) => {

    socket.on('data', (chunk) => {
        console.log("i got data", chunk)
        console.log(String(chunk))
        const parser = new Parser();
        const resp = parser.parse(chunk)

    })
})

server.listen(4221, '127.0.0.1');



