import React from 'react';



function withdrawPoolMove(props: any) {

  return (
    <div className="floating-box">
        <p className="pb-3 mb-0 md-font" >Translation (aka Parsed Text)</p>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Type:</p>
            <p className="right mb-0">{props.data.operationType === 1 ? <span>Withdraw</span> : <span>Pool Move</span>}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Destination: </p>
            <p className="right mb-0 xs-font">{props.data.target}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Asset:</p>
            <p className="right mb-0 sm-font">{props.data.instrumentName}</p>
        </div>
        <div className="display-info sm-font">
            <p className="left mb-0">Amount:</p>
            <p className="right mb-0">{props.data.amount}</p>
        </div>
    </div>
  );
}

export default withdrawPoolMove;