
import zlib from 'zlib';
export enum EncodingEnum {
    gzip = 'gzip'
}

const acceptedEncodings: EncodingEnum[] = [EncodingEnum.gzip]

interface EncodeResponse {
    encodedData: Uint8Array<ArrayBufferLike>,
    encoding: EncodingEnum
}


export class EncodingError extends Error { }

export class Encoding {

    async decode(encoding: EncodingEnum, data: Uint8Array<ArrayBufferLike>): Promise<Buffer> {
        switch (encoding) {
            case EncodingEnum.gzip:
                return await this.decodeGzip(data);
            default:
                throw new EncodingError("unsported encoding")
        }
    }

    private decodeGzip(data: Uint8Array<ArrayBufferLike>): Promise<Buffer> {
        return new Promise((resolve, rej) => {
            zlib.gunzip(data, (err, res) => {
                if (err) {
                    rej(new Error(`problem decoding gzip ${err}`))
                }

                resolve(res)
            })
        })


    }

    private getEncoding(encodings: string[]): EncodingEnum | null {
        for (const enc of encodings) {
            for (const acceptedEncoding of acceptedEncodings) {
                if (acceptedEncoding == enc) {
                    return acceptedEncoding as EncodingEnum
                }
            }
        }
        return null;
    }

    async encode(encodings: string, data: Uint8Array<ArrayBufferLike>): Promise<EncodeResponse> {
        const encoding = this.getEncoding(encodings.split(',').map(item => item.trim()));
        let encodedData: Uint8Array<ArrayBufferLike>
        switch (encoding) {
            case EncodingEnum.gzip:
                encodedData = await this.encodeGzip(data);
                break;
            default:
                throw new EncodingError("not recognized encoding")
        }

        return {
            encodedData,
            encoding
        }
    }

    private encodeGzip(data: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBufferLike>> {
        return new Promise((res, rej) => {
            zlib.gzip(data, (err, result) => {
                if (err) {
                    return rej(new Error("encoding error"));
                }

                res(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
            })
        })


    }

}