import { CHAIN_UTILS, Instrument, InstrumentAmount, SupportedChainId, SUPPORTED_CHAIN_IDS, UserAddress } from "@c3exchange/sdk";
import { InstrumentSlotId, IPackedInfo, decodeBase16, decodeString, decodeUint, decodeUint16, unpackFormat, decodeUint64, encodeBase64 } from "@c3exchange/common"
import algosdk, { encodeAddress } from "algosdk";

const indexServer = "https://testnet-idx.algonode.cloud";
const algoServer = "https://node.testnet.algoexplorerapi.io";

export const client = new algosdk.Indexer("", indexServer, "");

export const algodClient = new algosdk.Algodv2("", algoServer, "");

export const instrumentBoxName = encodeString("i")
const apiUrl = "https://api.test.c3.io/v1/system-info";

async function fetchCOREAPPID(url: string): Promise<number> {

    const response = await fetch(url);
    const jsonData = await response.json();

    if (jsonData.contractIds && jsonData.contractIds.ceOnchain) {
        return jsonData.contractIds.ceOnchain;
    }
    else {
        throw new Error("Unable to fetch CORE_APP_ID. check /v1/system-info endpoint");
    }
}

export let CORE_APP_ID: number = await fetchCOREAPPID(apiUrl);

export interface Holding {
    instrument: Instrument,
    amount: number,
}

export interface Account {
    id: InstrumentSlotId,
    name: string,
    amount: InstrumentAmount
}

export function encodeString(value: string | Uint8Array): Uint8Array {
    return new Uint8Array(Buffer.from(value))
}

export async function readAppBox(id: any, key: Uint8Array): Promise<Uint8Array> {
    const response = await algodClient.getApplicationBoxByName(id, key).do()
    return response.value
}

export function findChainIdByAddress(address: UserAddress): SupportedChainId {
    for (const key of SUPPORTED_CHAIN_IDS) {
        if (CHAIN_UTILS[key].isValidAddress(address)) {
            return key
        }
    }

    throw new Error(`Invalid address: ${address}`)
}

export function getPublicKeyByAddress(address: UserAddress): Uint8Array {
    const chainId = findChainIdByAddress(address)
    return CHAIN_UTILS[chainId].getPublicKey(address)
}

// Decoder

export const signedHeaderFormat: IPackedInfo = {
    target: { type: "address" },
    lease: { type: "bytes", size: 32 },
    lastValid: { type: "number" },
}

export const withdrawFormat = '(byte,uint8,uint64,(uint16,address),uint64,uint64)'//"(byte,uint8,uint64,(uint16,byte[]),uint64,uint64)"

export const poolFormat = "(byte,(uint8,uint64)[])"

export const delegateFormat = "(byte,byte[],uint64,uint64)"

export const accountMoveFormat = "(byte,byte[],(uint8,uint64)[],(uint8,uint64)[])"

const ORDER_OPERATION_STR = '06'

const orderDataFormat: IPackedInfo = {
    operation: { type: 'fixed', valueHex: ORDER_OPERATION_STR },
    account: { type: 'base64', size: 32 },
    nonce: { type: 'number' },
    expiresOn: { type: 'number' },
    sellSlotId: { type: 'byte' },
    sellAmount: { type: 'uint' },
    maxBorrow: { type: 'uint' },
    buySlotId: { type: 'byte' },
    buyAmount: { type: 'uint' },
    maxRepay: { type: 'uint' },
}

export const settleFormat = packABIString(orderDataFormat)



const MAX_SIGNATURE_LENGTH = 65
const SHA256_HASH_LENGTH = 32


export function packABIString(format: IPackedInfo): string {
    const internalPackABIString = (format: IPackedInfo): string[] => {
        return Object.entries(format).map(([, type]) => {
            switch (type.type) {
                case 'object':
                case 'hash':
                    return "(" + internalPackABIString(type.info) + ")"
                case 'array':
                    return internalPackABIString({ value: type.info }) + "[]"
                case 'address':
                    return 'address'
                case 'byte':
                    return 'byte'
                case 'bytes':
                case 'string':
                case 'base64':
                    return 'byte[' + (type.size ?? "") + ']'
                case 'number':
                case 'uint':
                    return 'uint' + ((type.size ?? 8) * 8)
                case 'fixed':
                    if (type.valueHex.length === 2) {
                        // It's only one byte
                        return 'byte'
                    }
                    return 'byte[' + (type.valueHex.length / 2) + ']'
                default:
                    throw new Error(`Type ${type.type} is not supported or recognized`)
            }
        })
    }
    return "(" + internalPackABIString(format).join(",") + ")"
}

export function unpackPartialData(data: Uint8Array, formatOpt?: IPackedInfo, offset = 0): { result: Record<string, any>, bytesRead: number } {

    let format: IPackedInfo
    let index = offset

    if (formatOpt) {
        format = formatOpt
    } else {
        const length = Number(decodeUint64(data.slice(index, index + 8)))
        index += 8
        format = unpackFormat(data.slice(index, index + length))
        index += length
    }

    const unpackInner = (data: Uint8Array, format: IPackedInfo) => {
        const object: Record<string, any> = {}
        for (const [name, type] of Object.entries(format)) {
            if (index >= data.length) {
                throw new Error(`Unpack data length was not enough for the format provided. Data: ${data}, format: ${JSON.stringify(format)}`)
            }
            let value: any
            switch (type.type) {
                case 'object':
                    value = unpackInner(data, type.info)
                    break
                case 'hash':
                    value = new Uint8Array(data.slice(index, index + SHA256_HASH_LENGTH))
                    index += SHA256_HASH_LENGTH
                    break
                case 'array': {
                    const count = data[index++]
                    value = []
                    for (let i = 0; i < count; i++) {
                        value.push(unpackInner(data, { value: type.info }).value)
                    }
                    break
                }
                case 'address':
                    // FIXME: THIS DOESN'T ENCODE ETHEREUM ADDRESS WE ARE ALL GOING TO DIE
                    value = encodeAddress(data.slice(index, index + 32))
                    index += 32
                    break
                case 'bytes': {
                    let size: number
                    if (type.size === undefined) {
                        size = decodeUint16(data.slice(index, index + 2))
                        index += 2
                    } else {
                        size = type.size
                    }
                    value = new Uint8Array(data.slice(index, index + size))
                    index += size
                    break
                }
                case 'base64': {
                    let size: number
                    if (type.size === undefined) {
                        size = decodeUint16(data.slice(index, index + 2))
                        index += 2
                    } else {
                        size = type.size
                    }
                    value = encodeBase64(data.slice(index, index + size))
                    index += size
                    break
                }
                case 'signature':
                    value = encodeBase64(data.slice(index, index + MAX_SIGNATURE_LENGTH))
                    index += MAX_SIGNATURE_LENGTH
                    break
                case 'double':
                    value = Buffer.from(data.slice(index, index + 8)).readDoubleLE(0)
                    index += 8
                    break
                case 'boolean':
                    value = data.slice(index, index + 1)[0] === 1
                    index += 1
                    break
                case 'number': {
                    const length = type.size ?? 8
                    value = Number(decodeUint(data.slice(index, index + length), length))
                    index += length
                    break
                }
                case 'uint': {
                    const length = type.size ?? 8
                    value = decodeUint(data.slice(index, index + length), length)
                    index += length
                    break
                }
                case 'string': {
                    let size: number
                    if (type.size === undefined) {
                        size = decodeUint16(data.slice(index, index + 2))
                        index += 2
                    } else {
                        size = type.size
                    }

                    value = decodeString(data.slice(index, index + size))
                    index += size
                    break
                }
                case 'emptyString':
                    value = ""
                    break
                case 'fixed':
                    value = decodeBase16(type.valueHex)
                    index += value.length
                    break
                default:
                    throw new Error(`Unknown decode type: ${type}`)
            }

            object[name] = value
        }

        return object
    }

    return { result: unpackInner(data, format), bytesRead: index - offset }
}

