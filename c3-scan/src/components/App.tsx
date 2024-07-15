import React from 'react';
import './App.css';
import C3CoreContract from './contractState';
import OperationMessages from './operationMessages';


function App() {
  return (
    <div className="App">
      <OperationMessages />
      <C3CoreContract />
    </div>
  );
}

export default App;
