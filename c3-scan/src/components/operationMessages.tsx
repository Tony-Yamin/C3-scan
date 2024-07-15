import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './operationMessages.css';
import { decodeMessage } from './messages';
import myImage from '../images/image.png';
import WithdrawPoolMove from './decoderSections/withdraw-poolMove';
import Login from './decoderSections/login';
import Settle from './decoderSections/settle';


function OperationMessages() {

  const [encodedMessage, setEncodedMessage] = useState("");
  const [decodedMessage, setDecodedMessage] = useState<any>();
  const [showImage, setShowImage] = useState(true);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setEncodedMessage(event.target.value);
  }

  async function handleClick(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowImage(false);

    let data = "";
    try {
      const aux = decodeMessage(encodedMessage);
      setDecodedMessage(aux)
    } catch (error) {
      data = "ERROR: " + error
      console.log(error);
    }
    
  }

  function renderComponentBasedOnOperationType() {
    if (decodedMessage?.operationType === 1 || decodedMessage?.operationType === 2) {
        return <WithdrawPoolMove data={decodedMessage}/>;
    } else if (decodedMessage?.operationType === -1) {
        return <Login data={decodedMessage}/>;
    } else if (decodedMessage?.operationType === 6){
        return <Settle data={decodedMessage}/>;
    }
}

  return (
    <div className="container">
      <div className="row">
        <div className='col-10 col-lg-11 mx-auto mt-5'>
          <div className="row equal-height">
            <h1 className="mb-4 bold">C3 Base64 Decoder</h1>
            <div className="col-12 col-lg-6 mb-5 mb-lg-0">
              <div className='floating-box'>
                <h5 className="pb-3 mb-0 bold">Use this tool to decode the message your wallet is prompted when using C3</h5>
                <p className="pb-3 mb-0 md-font">It will translate it from the base64 format to text using the open source algorithm found here</p>
                <p className="pb-3 mb-0 md-font">Input Encoded Message (Base64)</p>
                <form onSubmit={handleClick}>
                    <textarea className="custom-textbox mb-3 sm-font" placeholder="Paste here the encoded message your wallet prompted to sign" onChange={handleChange}/>
                    <button type="submit" className="custom-button">Decode Message</button>
                </form>
              </div>
            </div>
            <div className={`col-12 col-lg-6 ${showImage ? 'd-none d-md-block' : ''}`}>
              {showImage ? (
                <img src={myImage} className="img-fluid"/>
              ) : (
                renderComponentBasedOnOperationType()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationMessages;


