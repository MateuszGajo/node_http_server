export interface HttpRequest {
    method: string,
    path: string,
    version: string,
    headers: Record<string, string>,
    pathParam: Record<string, string>,
    body: Uint8Array<ArrayBufferLike>
}

export interface HttpResponse {
    version: string,
    status: string,
    statusMsg: string,
    headers: Record<string, string>,
    pathParam: Record<string, string>,
    body: Uint8Array<ArrayBufferLike>
}

export class Parser {

    request: HttpRequest = {
        method: "",
        path: "",
        version: "",
        headers: {},
        pathParam: {},
        body: new Uint8Array(),
    };

    response: HttpResponse = {
        status: "",
        statusMsg: "",
        version: "",
        headers: {},
        pathParam: {},
        body: new Uint8Array(),
    };


    bufferSplitByCRLF(data: Buffer): Buffer[] {
        let start = 0
        let el: Buffer[] = []
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


    parseReq(data: Buffer) {
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


        const requestLineSplit = requestLine.split(" ");
        if (requestLineSplit.length != 3) {
            throw new Error("request error line shoud contain method, path and version")
        }

        this.request.method = requestLineSplit[0]
        this.request.path = requestLineSplit[1]
        this.request.version = requestLineSplit[2]

        const body = bufferSplited.shift();

        const contentLength = headers['Content-Length']?.trim();

        this.request.headers = headers;



        if (body && body.length == Number(contentLength)) {
            this.request.body = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
        }


        return this.request
    }

    parseRes(data: Buffer) {
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

        this.response.version = requestLineSplit[0]
        this.response.status = requestLineSplit[1]
        this.response.statusMsg = requestLineSplit[2]

        this.response.headers = headers;

        if (body) {
            this.response.body = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
        }


        return this.response
    }
}
