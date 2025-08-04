import { HttpRequest } from "./parser";
import net from 'net';
import { ServerContext } from "./server";
import { Encoding, EncodingError } from "./encoding";

interface Handler {
    path: string,
    normalizedPathRegex: RegExp;
    path_keys: any[],
    method: string,
    callback: (req: HttpRequest, res: Response, ctx: Context) => void;
}

interface HttpResponse {
    status: number;
    statusMsg: string;
    text: Uint8Array<ArrayBufferLike>;
    responseHeaders: Record<string, string>

}


export class Response {
    res: HttpResponse;
    version: string;
    socket: net.Socket;
    headers: Record<string, string>
    overrideHeaders: Record<string, string>
    reqHeaders: Record<string, string>
    econding: Encoding

    constructor(version: string, socket: net.Socket, reqHeaders: Record<string, string>) {
        this.res = {
            status: 200,
            statusMsg: "OK",
            text: new Uint8Array(),
            responseHeaders: {},

        }
        this.version = version
        this.socket = socket;
        this.headers = {}
        this.overrideHeaders = {}
        this.reqHeaders = reqHeaders
        this.econding = new Encoding()
    }

    private getStatusMsg(status: number) {
        switch (status) {
            case 200:
                return "OK";
            case 201:
                return "Created";
            case 404:
                return "Not Found";
            default:
                return "Server Error"
        }
    }

    status(status: number) {
        this.res.status = status
        this.res.statusMsg = this.getStatusMsg(status);

        return this;
    }

    text(text: string) {
        if (!text) {
            throw new Error("value is empty")
        }


        const buffer = Buffer.from(text, 'utf-8');
        this.res.text = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);



        return this;
    }

    setHeader(name: string, val: string) {
        this.overrideHeaders[name] = val;

        return this;
    }

    async sendAsync() {


        let text = this.res.text

        if (this.reqHeaders['Accept-Encoding']) {
            try {
                const { encodedData, encoding } = await this.econding.encode(this.reqHeaders['Accept-Encoding'], text);
                this.headers['Content-Encoding'] = encoding
                text = encodedData;
            } catch (err) {
                if (!(err instanceof EncodingError)) {
                    throw err;
                }
            }
        }

        this.headers['Content-Length'] = String(text.length);
        this.headers['Content-Type'] = 'text/plain'



        let headers: Record<string, string> = {}
        for (const key in this.headers) {
            headers[key] = this.headers[key]
        }

        for (const key in this.overrideHeaders) {
            headers[key] = this.overrideHeaders[key]
        }
        let headersString = '\r\n'
        for (const key in headers) {
            headersString += key + ": "
            headersString += headers[key] + "\r\n"
        }




        const response = this.version + " " + this.res.status + " " + this.res.statusMsg + headersString + "\r\n";

        const versionNumber = this.version.split("/");
        this.socket.write(response);
        const resp = this.socket.write(text)
        if (Number(versionNumber[1]) < 1.1 || this.reqHeaders['Connection'] == "close") {
            console.log("end connnection??")
            console.log("end connnection??")
            console.log("end connnection??")
            this.socket.end()
        }

        console.log("did it flush")
        console.log(resp)

    }

    send() {

        this.sendAsync()

    }
}



interface Context {
    directory: string
}

export class Router {
    handlers: Handler[]
    constructor() {
        this.handlers = []
    }

    normalizePath(pattern: string) {
        const keys: any[] = [];
        const regex = "^" + pattern.replace(/{([^/]+)}/g, (_, key) => {
            keys.push(key)
            return "([^/]+)";
        }) + "$";
        return {
            regex: new RegExp(regex),
            keys,
        }
    }

    extractParams(handler: Handler, path: string, matchResult: any[]) {
        return handler.path_keys.reduce((acc, key, i) => {
            acc[key] = matchResult[i + 1];
            return acc;
        }, {})
    }

    addHandler(path: string, method: string, callback: Handler['callback']) {
        const { regex, keys } = this.normalizePath(path)

        this.handlers.push({ path, method, callback, normalizedPathRegex: regex, path_keys: keys })
    }


    handleRequest(req: HttpRequest, socket: net.Socket, context: ServerContext) {

        const response = new Response(req.version, socket, req.headers);
        for (const handler of this.handlers) {
            const pathMatchRegex = req.path.match(handler.normalizedPathRegex);

            if (pathMatchRegex && req.method == handler.method) {
                const pathParams = this.extractParams(handler, req.path, pathMatchRegex);
                req.pathParam = pathParams;

                const reqContext: Context = {
                    directory: context.directory
                }
                handler.callback(req, response, reqContext);
                return;
            }
        }

        response.status(404).send();
    }
}