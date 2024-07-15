import React from 'react';

function login(props: any) {
  return (
    <div className="floating-box">
        <p className="pb-3 mb-0 md-font" >Translation (aka Parsed Text)</p>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Type:</p>
            <p className="right mb-0">Login</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">User ID:</p>
            <p className="right mb-0 sm-font">{props.data.userID}</p>
        </div>
        <div className="display-info sm-font mb-3">
            <p className="left mb-0">Creation Time:</p>
            <p className="right mb-0 sm-font">{props.data.creationTime}</p>
        </div>
    </div>
  );
}

export default login;