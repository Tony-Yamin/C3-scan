import { decodeABIValue, decodeABIValueWithFormat, decodeBase64} from "@c3exchange/common"
import { InstrumentAmount } from "@c3exchange/sdk";
import { getInstrumentfromSlotId } from "./functions";
import { accountMoveFormat, delegateFormat, poolFormat, settleFormat, signedHeaderFormat, unpackPartialData, withdrawFormat } from "./imports";

export function decodeMessage(encodedBase64Message: string): any {
    const regex = /^\s*Welcome to C3/;
    if (regex.test(encodedBase64Message)) { // Login

        const regexLastWord = /([A-Za-z0-9+/=]+)\s*$/;
        const match = encodedBase64Message.match(regexLastWord);

        if (match) {
            let operation = match[1]

            const decodeNonce = Buffer.from(operation, 'base64').toString();
            const parts = decodeNonce.split('-');

            let operationType = -1

            let userID = parts[0];
            let extractedCreationTime = parts[1];

            let creationTime = new Date(parseInt(extractedCreationTime)).toString();

            return {operationType, userID, creationTime}
        }

    } else { // Not login
        
        let base64Message = encodedBase64Message;

        let byteArray = new Uint8Array(Buffer.from(base64Message, "utf-8"));

        let buffer = Buffer.from(byteArray);

        // Decode it from Base64
        let bytesToEncode = decodeBase64(buffer.toString('base64')); // Array of Bytes

        let base64String = '';
        for (let i = 0; i < bytesToEncode.length; i++) {
            base64String += String.fromCharCode(bytesToEncode[i]);
        }

        // Decode the Base64 string back into bytes
        let bytesArray = Array.from(atob(base64String), char => char.charCodeAt(0))

        // Convert the array of bytes to a Uint8Array
        let fullMessage = new Uint8Array(bytesArray);

        fullMessage = fullMessage.slice(8)

        const decodedHeader = unpackPartialData(fullMessage, signedHeaderFormat);




        const operation = fullMessage.slice(decodedHeader.bytesRead);
         

        const target = decodedHeader.result.target;
        // const lease = decodedHeader.result.lease;
        // const lastValid = decodedHeader.result.lastValid;

        if (operation[0] === 1) {
            let decodedResult = decodewithdraw(operation) 
            
            let decodedMessage = {
                operationType: decodedResult.operationType,
                instrumentName: decodedResult.instrumentName,
                amount: decodedResult.amount,
                target: target
            }

            return decodedMessage
        } else if (operation[0] === 2) { 
            let decodedResult = decodePoolMove(operation)  
            let decodedMessage = {
                operationType: decodedResult.operationType,
                instrumentName: decodedResult.instrumentName,
                amount: decodedResult.amount,
                target: target
            }

            return decodedMessage
        } else if (operation[0] === 6) {
            let decodedResult = decodeSettle(operation)
            return decodedResult
        }
    }
}

// Operation: 1 
function decodewithdraw(operation: Uint8Array) {
    const withdrawResult = decodeABIValue(operation, withdrawFormat)
    
    let operationType = withdrawResult[0]
    let instrumentSlotId = Number(withdrawResult[1])
    let encodedAmount = withdrawResult[2]
    let amount = Number(InstrumentAmount.fromContract(getInstrumentfromSlotId(instrumentSlotId),BigInt(encodedAmount)).toDecimal());
    // let receiver = withdrawResult.receiver
    // let maxBorrow = withdrawResult.maxBorrow
    
    let instrumentName = getInstrumentfromSlotId(instrumentSlotId).id

    return {operationType, instrumentName, amount}
}

// Operation: 2
function decodePoolMove(operation: Uint8Array) {

    const poolResult = decodeABIValue(operation, poolFormat)

    let operationType = 2
    let instrumentSlotId = Number(poolResult[1][0][0]);
    let encodedAmount = poolResult[1][0][1];
    let amount = Number(InstrumentAmount.fromContract(getInstrumentfromSlotId(instrumentSlotId),BigInt(encodedAmount)).toDecimal());
    
    let instrumentName = getInstrumentfromSlotId(instrumentSlotId).id

    return {operationType, instrumentName, amount}
}

// Operation: 3
function decodeDelegation(operation: Uint8Array) {
    const delegateResult = decodeABIValue(operation, delegateFormat)
    console.log(delegateResult)
    
    // let instrumentSlotId = Number(poolResult[1][0][0]);
    // let encodedAmount = poolResult[1][0][1];
    // let amount = Number(InstrumentAmount.fromContract(getInstrumentfromSlotId(instrumentSlotId),BigInt(encodedAmount)).toDecimal());
    // let operationType = "Pool"
    // let instrumentName = getInstrumentfromSlotId(instrumentSlotId).id

    // return {operationType, instrumentName, amount}
}

// Operation: 5
function decodeAccountMove(operation: Uint8Array) {
    const accountMoveResult = decodeABIValue(operation, accountMoveFormat)
    console.log(accountMoveResult)

    // let instrumentSlotId = Number(poolResult[1][0][0]);
    // let encodedAmount = poolResult[1][0][1];
    // let amount = Number(InstrumentAmount.fromContract(getInstrumentfromSlotId(instrumentSlotId),BigInt(encodedAmount)).toDecimal());
    // let operationType = "Pool"
    // let instrumentName = getInstrumentfromSlotId(instrumentSlotId).id

    // return {operationType, instrumentName, amount}
}

// Operation: 6
function decodeSettle(operation: Uint8Array) {
    const settleResult = decodeABIValue(operation, settleFormat)

    let operationType = settleResult[0]
    let account = ""
    let nonce = Number(settleResult[2])
    let expiresOn = new Date(parseInt(settleResult[3])).toString();
    let sellSlotId = settleResult[4]
    let sellAmount = Number(settleResult[5])
    let maxBorrow = Number(settleResult[6])
    let buySlotId = settleResult[7]
    let buyAmount = Number(settleResult[8])
    let maxRepay = Number(settleResult[9])

    return {operationType, account, nonce, expiresOn, sellSlotId, sellAmount, maxBorrow, buySlotId, buyAmount, maxRepay}
}

