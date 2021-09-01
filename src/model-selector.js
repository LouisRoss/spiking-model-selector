import { Component } from 'react';
import { Configuration } from "./configuration/configuration.js";
import { Button } from 'react-bootstrap';
import { ConnectDisconnectButton } from "./property-switch.js";
import './App.css';


const CommunicationState = {
  INITIALIZE: "init",
  GETDOMAINS: "getdomains",
  GOTDOMAINS: "gotdomains",
  POLLCOMPLETE: "pollcomplete",
  IDLE: "idle"
}

class ModelSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    
    this.communicationState = CommunicationState.INITIALIZE;
    this.restUrl = '';
    this.restBaseDomain = 'hdfgroup.org';
    this.modelInfo = new Map();
    
    this.ManageStates = this.ManageStates.bind(this);
    this.timerId = setInterval(this.ManageStates, 500);
    
    this.configuration = Configuration.getInstance();
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }
  
  ManageStates() {
    switch (this.communicationState) {
      case CommunicationState.INITIALIZE:
        this.handleInitializeState();
        break;
        
      case CommunicationState.GETDOMAINS:
        this.handleGetDomainsState();
        break;
        
      case CommunicationState.GOTDOMAINS:
        break;

      case CommunicationState.POLLCOMPLETE:
      case CommunicationState.IDLE:
      default:
        break;
    }
  }
    
  handleInitializeState() {
    if (this.configuration) {
      console.log(this.configuration);
      this.packagerHost = this.configuration.services.modelPackager.host;
      this.packagerPort = this.configuration.services.modelPackager.port;
      this.basePackagerUrl = this.packagerHost + ':' + this.packagerPort;
      this.communicationState = CommunicationState.GETDOMAINS;
    } else {
      this.configuration = Configuration.getInstance();
    }
  }

  handleGetDomainsState() {
    var init = {
      method: 'GET',
      mode: 'cors' 
    };
    
    this.requestResponseFromUrl(init, '/models', data => {
      var modelList = document.getElementById("models");
      while (modelList.length > 0) {
        modelList.remove(modelList.length - 1);
      }
      this.modelInfo.clear();
      
      console.log(data);
      data.forEach(model => {
        console.log('  ' + model);
        var modelEntry = document.createElement("option");
        modelEntry.text = model;
        modelList.add(modelEntry);
      });
      this.communicationState = CommunicationState.GOTDOMAINS;
    });
  }
            
  handleSelectionClick = (event) => {
    
  }

  createOrDelete(method, model) {
    var init = {
      method: method,
      mode: 'cors' 
    };
    
    const pollComplete = (link) => {
      fetch(link, init)
      .then(data => {
        return data.json()
      })
      .then(response => {
        if (response.completed) {
          var messages = document.getElementById('messages');
          messages.value += response.status + '\n';
          this.communicationState = CommunicationState.GETDOMAINS;
        } else {
          init.method = 'GET'
          setTimeout(pollComplete, 200, response.link);
        }
      });
    }

    console.log(`Requesting ${method} of model ${model}`);
    pollComplete(this.basePackagerUrl + '/model/' + model);
  }

  handleDeletionClick = (event) => {
    var model = document.getElementById("models").value;
    this.createOrDelete('DELETE', model);
  }

  handleCreationClick = (event) => {
    var newmodel = document.getElementById('newmodel').value;
    this.createOrDelete('POST', newmodel);
  }
  
  requestResponseFromUrl(init, url, callback) {
    var messages = document.getElementById('messages');
    
    fetch(this.basePackagerUrl + url, init)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        messages.value += "\nError response";  
      }  
    })  
    .then(data => {
      callback(data);  
    })  
    .catch(error => {
      messages.value += `\nError ${error}`;  
      console.log(`Error ${error}`);
      
      var disconnectedResponse = {query:init.body, response:{result:'ok', status: { connected: false }}};
      callback(disconnectedResponse);
    });  
  }
  
  render() {
    return (
      <section className="fullpane">
        <div className="connectbar">
          <div id="connectionPanel">
            <select name="models" id="models"></select>
            <ConnectDisconnectButton value="Select" disabled={() => false} onClick={() => this.handleSelectionClick()}/>
            <ConnectDisconnectButton value="Delete" disabled={() => false} onClick={(event) => this.handleDeletionClick(event)}/>
            <input id="newmodel" type="text"></input>
            <ConnectDisconnectButton value="Create" disabled={() => false} onClick={() => this.handleCreationClick()}/>
          </div>

          <div className="messagebar">
            <div className="messages">
              <textarea name="messages" id="messages" cols="120" rows="15" readOnly></textarea>
              <textarea name="status" id="status" cols="120" rows="5" readOnly></textarea>
            </div>
            <form>
              <Button variant="btn outline-primary" onClick={() => window.open(this.configuration.services.modelControl.host + ':' + this.configuration.services.modelControl.port + '/ControlPanel', '_blank')}>Control Panel</Button>
              <Button variant="btn outline-primary" onClick={() => window.open(this.configuration.services.modelVisualizer.host + ':' + this.configuration.services.modelVisualizer.port, '_blank')}>Monitor</Button>
            </form>
          </div>

        </div>
      </section>
    );
  }
}

export { ModelSelector };
