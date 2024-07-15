import {encodeAccountId,InstrumentAmount, ServerInstrument} from '@c3exchange/sdk';
import React, {useEffect, useState} from 'react';
import {retrevieUserAccounts, retrieveOnChainAppState, retrieveHoldingAssets} from './functions';
import {Holding, Account, getPublicKeyByAddress} from "./imports";
import './contractState.css';

function C3CoreContract() {

  const [coreState, setCoreState] = useState<ServerInstrument[]>([]);

  // Supported Assests
  useEffect(() => {
    const fetchData = async () => {
      const result = await retrieveOnChainAppState();
      setCoreState(result);
    };
    fetchData();
  }, []);

  // Assets in Custody
  const [holdingState, setHoldingState] = useState<Holding[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const result = await retrieveHoldingAssets();
      setHoldingState(result);
    };
    fetchData();
  }, []);

  const [userAddress, setUserAddress] = useState("");
  const [userAccountId, setUserAccountId] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUserAddress(event.target.value);
  }

  // Get User ID From Address
  async function handleClick(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let data = "";
    try {
        data = await encodeAccountId(getPublicKeyByAddress(userAddress));
    } catch (error) {
      console.log(error)
      data = "No User Found";
    }
    setUserAccountId(data);
  };

  // Get User Cash and Pool
  const [cashState, setCashState] = useState<Account[]>([]);
  const [poolState, setPoolState] = useState<Account[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (userAccountId) {
        if (coreState) {
          const {cash, pool} = await retrevieUserAccounts(userAccountId, coreState);
          setCashState(cash);
          setPoolState(pool);
        }
      }
    };
    fetchData();
  }, [coreState, userAccountId]);

  return (
    <div className="container">
      <h1>C3 Core Contract State</h1>

      <h2>Assets</h2>
      <div className="box-container">
        <table>
            <tr>
                <td>Asset</td>
                <td>Total</td>
                <td>Liquidity</td>
                <td>Borrowed</td>
                <td>Utilization Rate</td>
            </tr>
        {holdingState?.map((holdingAsset) => {

          const serverInstrument = coreState.find(serverInstrument => serverInstrument.instrument.asaId === holdingAsset.instrument.asaId);

          const amount = Number(InstrumentAmount.fromContract(holdingAsset.instrument,BigInt(holdingAsset.amount)).toDecimal());
          const formatNumber = new Intl.NumberFormat('en-US').format;

          if (serverInstrument) {
            const liquidity = Number(InstrumentAmount.fromContract(serverInstrument.instrument,serverInstrument.pool.poolData.liquidity).toDecimal());
            const borrowed = Number(InstrumentAmount.fromContract(serverInstrument.instrument,serverInstrument.pool.poolData.borrowed).toDecimal());
            const utilizationRate = liquidity !== 0 ? borrowed / liquidity : 0;

            return (
                <tr>
                    <td>{holdingAsset.instrument.id}</td>
                    <td>{formatNumber(amount)}</td>
                    <td>{formatNumber(liquidity)}</td>
                    <td>{formatNumber(borrowed)}</td>
                    <td>{formatNumber(utilizationRate)}</td>
                </tr>
            //   <div key={holdingAsset.instrument.asaId} className="box">
            //     <p className="displayInfo"><b>{holdingAsset.instrument.id}</b></p>
            //     <p className="displayInfo">Borrowed: {formatNumber(borrowed)}</p>
            //     <p className="displayInfo">Liquidity: {formatNumber(liquidity)}</p>
            //     <p className="displayInfo">Utilization Rate: {formatNumber(utilizationRate)}</p>
            //     <p className="displayInfo"> Amount: {formatNumber(amount)}</p>
            //   </div>
            );
          } else {
            return (
                <tr>
                    <td>{holdingAsset.instrument.id}</td>
                    <td>{formatNumber(amount)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            //   <div key={holdingAsset.instrument.asaId} className="box">
            //     <p className="displayInfo"><b>{holdingAsset.instrument.id}</b></p>
            //     <p className="displayInfo"> Amount: {formatNumber(amount)}</p>
            //   </div>
            );
          }
        })}
        </table>
      </div>

      <h1>User Accounts</h1>
      <form onSubmit={handleClick}>
        <input type="text" placeholder="User Address" onChange={handleChange}/>
        <button type="submit">Submit</button>
      </form>
      <p>User Account ID:</p>
      <p className="font-medium">{userAccountId}</p>

      <h2>Non Pooled Amount:</h2>
      <div>
        <table>
            <tr>
                <td>Asset</td>
                <td>Cash</td>
            </tr>
      {cashState.map(cashUser => {
        const formatNumber = new Intl.NumberFormat('en-US').format;
        const amount = Number(cashUser.amount.toDecimal());
        return (
            <tr>
                <td>{cashUser.name}</td>
                <td>{formatNumber(amount)}</td>
            </tr>
            // <div className="box-container">
            //   <div key={cashUser.id} className="box">
            //     <p className="displayInfo">{cashUser.name} : {formatNumber(amount)}</p>
            //   </div>
            // </div>
        );
      })}
        </table>
      </div>

      <h2>Pooled Amount:</h2>
      <div>
        <table>
            <tr>
                <td>Asset</td>
                <td>Position</td>
            </tr>
      {poolState.map(poolUser => {
        const formatNumber = new Intl.NumberFormat('en-US').format;
        const amount = Number(poolUser.amount.toDecimal());
        return (
            <tr>
                <td>{poolUser.name}</td>
                <td>{formatNumber(amount)}</td>
            </tr>
        //   <div>
        //       <div className="box-container">
        //         <div key={poolUser.id} className="box">
        //           <p className="displayInfo">{poolUser.name} : {formatNumber(amount)}</p>
        //         </div>
        //       </div>
        //   </div>
        );
      })}
        </table>
      </div>

    </div>
  );
};

export default C3CoreContract;


