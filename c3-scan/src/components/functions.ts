import {parseCoreUserState, parseCoreInstruments, CoreUserState, ALGO_INSTRUMENT, InstrumentAmount, AssetId, Instrument, InstrumentInfoFetcher} from "@c3exchange/sdk";
import {ServerInstrument, decodeAccountId} from "@c3exchange/common"
import {getApplicationAddress} from "algosdk"
import {client, Holding, Account, readAppBox, instrumentBoxName, CORE_APP_ID} from "./imports"

// Created Function
async function getInstrumentInfo(assetId: AssetId): Promise<Instrument | undefined> {
    try {
        const data = await client.lookupAssetByID(assetId).do();
        const result: Instrument = {
            id: data.asset.params['unit-name'],
            asaId: data.asset.index,
            asaName: data.asset.params.name,
            asaUnitName: data.asset.params['unit-name'],
            asaDecimals: data.asset.params.decimals,
            chains: []
        }
        return result;
    } catch (e) {
        throw e;
    }
}

// Re-used Function but changed return parameter 2 from deployer to getInstrumentInfo
export async function retrieveOnChainAppState(round?: number): Promise<ServerInstrument[]> {
    try {
        const response = await readAppBox(CORE_APP_ID, instrumentBoxName);
        return parseCoreInstruments(response, (await retrieveHoldingAssets()).length, async (assetId: AssetId) => assetId === 0 ? ALGO_INSTRUMENT : getInstrumentInfo(assetId));

    } catch (e) {
        console.error(e)
    }
    return []
}

export async function retrieveHoldingAssets(): Promise<Holding[]> {
    const CORE_APP_ADDRESS = getApplicationAddress(CORE_APP_ID);
    try {
        const accountInfo = await client.lookupAccountByID(CORE_APP_ADDRESS).do()
        let holdingAssets: Holding[] = [];

        holdingAssets.push({instrument: ALGO_INSTRUMENT, amount: accountInfo.account.amount});
        for (let asset of accountInfo.account.assets) {
            const instrument = await getInstrumentInfo(asset['asset-id']);
            if (instrument) {
                holdingAssets.push({instrument, amount: asset.amount});
            }
        }
        return holdingAssets;
    } catch (error) {
        throw error
    }
}

async function getRawCoreUserState(decodedUserAddress: Uint8Array): Promise<Uint8Array> {
    try {
        return await readAppBox(CORE_APP_ID, decodedUserAddress)
    } catch(error) {
        console.error("ERROR reading App Box: ", error)
        return new Uint8Array()
    }
}

// Re-used Function with minor changes
export async function retrieveOnChainAccountState(address: string, round?: number): Promise<CoreUserState> {
    try {
        const decodedAddress = decodeAccountId(address);
        const coreUserState = await getRawCoreUserState(decodedAddress)
        const holdings = await retrieveHoldingAssets()

        return parseCoreUserState(coreUserState)
    } catch (error) {
       throw error;
    }
}

// Created Function
export async function retrevieUserAccounts(address: string, serverInstrument: ServerInstrument[]): Promise<{cash: Account[], pool: Account[]}> {
    const data = await retrieveOnChainAccountState(address);

    let cash: Account[] = retrievePositions(data, serverInstrument, 1);

    let pool: Account[] = retrievePositions(data, serverInstrument, 2);

    return {cash, pool}
}

function retrievePositions(position: CoreUserState, serverInstrument: ServerInstrument[], type: number): Account[] {
    let result: Account[] = [];
    let positionAmount
    for (let [key, value] of position.entries()) {
        for (let server_instrument of serverInstrument) {
            if (server_instrument.slotId === key) {
                if (type === 1) positionAmount = value.cash
                else if (type === 2) positionAmount = value.principal
                if (positionAmount && positionAmount !== 0n) {
                    result.push({
                        id: key,
                        name: server_instrument.instrument.id,
                        amount: InstrumentAmount.fromContract(server_instrument.instrument, positionAmount)
                    });
                    break;
                }
            }
        }
    }
    return result;
}

const appState = await retrieveOnChainAppState()

export function getInstrumentfromSlotId(id: number): Instrument {
    for (let instrument of appState) {
        if (instrument.slotId === id) {
            return instrument.instrument
        }
    }
    return defaultInstrument
}

const defaultInstrument = {
    id: "",
    asaId: 0,
    asaName: "",
    asaUnitName: "",
    asaDecimals: 0,
    chains: []
}
