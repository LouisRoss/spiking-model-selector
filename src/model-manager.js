import { useState, useEffect } from 'react';
import { ConnectDisconnectButton } from './property-switch.js';
import './App.css';
import configuration from './configfiles/configuration.json';
const basePackagerUrl = configuration.services.modelPackager.host + ':' + configuration.services.modelPackager.port;


const ModelManager = ({onSelectClick}) => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    const messages = document.getElementById('messages');
    fetch(basePackagerUrl + '/models', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      setModels([...response]);
      if (messages) {
        messages.value += 'Retrieved models ' + response + '\n'
      }
    });
  }, []);

  const fetchModels = () => {
    const messages = document.getElementById('messages');
    fetch(basePackagerUrl + '/models', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      setModels([...response]);
      if (messages) {
        messages.value += 'Retrieved models ' + response + '\n'
      }
    });
  }

  const handleModelSelectionClick = () => {
    const selectedModel = document.getElementById("modelselectlist").value;
    setSelectedModel(selectedModel);
    onSelectClick(selectedModel);
  }

  const createOrDelete = (method, model) => {
    var init = {
      method: method,
      mode: 'cors' 
    };
    
    const pollComplete = (link) => {
      fetch(link, init)
      .then(data => data.json())
      .then(response => {
        if (response.completed) {
          var messages = document.getElementById('messages');
          messages.value += response.status + '\n';
          fetchModels();
        } else {
          init.method = 'GET'
          setTimeout(pollComplete, 200, response.link);
        }
      });
    }

    console.log(`Requesting ${method} of model ${model}`);
    pollComplete(basePackagerUrl + '/model/' + model);
  }

  const handleCreateButtonClick = () => {
    var newmodel = document.getElementById('newmodel').value;
    createOrDelete('POST', newmodel);
  }

  const handleControlButtonClick = () => {
    window.open(configuration.services.modelControl.host + ':' + configuration.services.modelControl.port + '/' + selectedModel, '_blank');
  }

  const handleMonitorButtonClick = () => {
    window.open(configuration.services.modelMonitor.host + ':' + configuration.services.modelMonitor.port + '/' + selectedModel, '_blank');
  }

  const handleDeleteButtonClick = () => {
    const model = document.getElementById("modelselectlist").value;
    createOrDelete('DELETE', model);
    setSelectedModel('');
    onSelectClick('');
  }


  return (
    <div className="model-management">
      <label>Model</label>
      <div className="model-manager">
        <div className="model-controls">
          <ConnectDisconnectButton ident="createbutton" value="Create" disabled={() => false} onClick={handleCreateButtonClick}/>
          <ConnectDisconnectButton ident="controlbutton" value="Control" disabled={() => false} onClick={handleControlButtonClick}/>
          <ConnectDisconnectButton ident="monitorbutton" value="Monitor" disabled={() => false} onClick={handleMonitorButtonClick}/>
          <ConnectDisconnectButton ident="deletebutton" value="Delete" disabled={() => false} onClick={handleDeleteButtonClick}/>
        </div>
        <div className="model-controls">
          <input id="newmodel" type="text"></input>
          <select name="modelselectlist" id="modelselectlist" onChange={handleModelSelectionClick} size="9">
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
           </select>
         </div>
      </div>
    </div>
  );
}


export { ModelManager };
