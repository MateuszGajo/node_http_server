import { HttpRequest } from "./parser";
import net from 'net';

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
    text: string;
    responseHeaders: Record<string, string>
}


export class Response {
    res: HttpResponse;
    version: string;
    socket: net.Socket;
    headers: Record<string, string>

    constructor(version: string, socket: net.Socket) {
        this.res = {
            status: 200,
            statusMsg: "OK",
            text: "",
            responseHeaders: {},
        }
        this.version = version
        this.socket = socket;
        this.headers = {}
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
        this.res.text = text;

        this.headers['Content-Length'] = String(text.length);
        this.headers['Content-Type'] = 'text/plain'

        return this;
    }

    setHeader(name: string, val: string) {
        this.res.responseHeaders[name] = val;

        return this;
    }

    send() {
        let headersString = '\r\n'

        for (const key in this.headers) {
            headersString += key + ": "
            headersString += this.headers[key] + "\r\n"
        }
        const response = this.version + " " + this.res.status + " " + this.res.statusMsg + headersString + "\r\n" + this.res.text;

        this.socket.write(response);
        this.socket.end()
        this.socket.destroy()
    }
}



interface Context { }

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


    handleRequest(req: HttpRequest, socket: net.Socket) {

        const response = new Response(req.version, socket);
        for (const handler of this.handlers) {
            const match = req.path.match(handler.normalizedPathRegex);

            if (match) {
                const pathParams = this.extractParams(handler, req.path, match);
                req.pathParam = pathParams;

                const context = {}
                handler.callback(req, response, context);
                return;
            }
        }

        response.status(404).send();
    }
}