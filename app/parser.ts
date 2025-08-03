export interface HttpRequest {
    method: string,
    path: string,
    version: string,
    headers: Record<string, string>,
    pathParam: Record<string, string>,
    body: string;
}

export class Parser {

    request: HttpRequest = {
        method: "",
        path: "",
        version: "",
        headers: {},
        pathParam: {},
        body: ""
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


    parse(data: Buffer) {
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
