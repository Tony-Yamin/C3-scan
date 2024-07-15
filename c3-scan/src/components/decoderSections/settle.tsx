import React from 'react';

function settle(props: any) {
  return (
    <div className="floating-box">
        <p className="pb-3 mb-0 md-font" >Translation (aka Parsed Text)</p>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Type:</p>
            <p className="right mb-0">Settle</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Account:</p>
            <p className="right mb-0 sm-font">{props.data.account}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Nonce:</p>
            <p className="right mb-0 sm-font">{props.data.nonce}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Expires On:</p>
            <p className="right mb-0 sm-font">{props.data.expiresOn}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Sell Slot Id:</p>
            <p className="right mb-0 sm-font">{props.data.sellSlotId}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Sell Amount:</p>
            <p className="right mb-0 sm-font">{props.data.sellAmount}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Max Borrow:</p>
            <p className="right mb-0 sm-font">{props.data.maxBorrow}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Buy Slot Id:</p>
            <p className="right mb-0 sm-font">{props.data.buySlotId}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Buy Amount:</p>
            <p className="right mb-0 sm-font">{props.data.buyAmount}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Max Repay:</p>
            <p className="right mb-0 sm-font">{props.data.maxRepay}</p>
        </div>
        
    </div>
  );
}

export default settle;

