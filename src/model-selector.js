import { Component } from 'react';
import { Configuration } from "./configuration/configuration.js";
import { Button } from 'react-bootstrap';
import { ConnectDisconnectButton } from "./property-switch.js";
import './App.css';


const CommunicationState = {
    INITIALIZE: "init",
    GETDOMAINS1: "getdomains1",
    GETDOMAINS2: "getdomains2",
    GOTDOMAINS: "gotdomains",
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
        if (this.configuration) {
          console.log(this.configuration);
          this.communicationState = CommunicationState.GETDOMAINS1;
        } else {
          this.configuration = Configuration.getInstance();
        }
        break;

      case CommunicationState.GETDOMAINS1:
        this.requestResponseFromConfiguredStore((data) => {
          console.log(data);
          if (data.hrefs) {
            this.restUrl = data.hrefs.find((href) => { return href.rel === 'root'; }).href;
            console.log(this.restUrl);
            this.communicationState = CommunicationState.GETDOMAINS2;
          } else {
            this.communicationState = CommunicationState.IDLE;
          }
        });
        break;
        
      case CommunicationState.GETDOMAINS2:
        var init = {
          method: 'GET',
        };
        this.requestResponseFromUrl(init, this.restUrl + '/links', (data) => {
          console.log(data);
          var modelList = document.getElementById("models");
          while (modelList.length > 0) {
            modelList.remove(modelList.length - 1);
          }
          this.modelInfo.clear();
          
          data.links.forEach((link) => {
            console.log('  ' + link.title);
            var modelEntry = document.createElement("option");
            modelEntry.text = link.title;
            modelList.add(modelEntry);
            this.modelInfo.set(link.title, { name: link.title, url: link.target, h5domain: link.h5domain });
          });
          this.communicationState = CommunicationState.GOTDOMAINS;
        });
        break;
        
      case CommunicationState.GOTDOMAINS:
      case CommunicationState.IDLE:
      default:
        break;
    }
  }
            
            
  requestResponseFromConfiguredStore(callback) {
    var init = {
      method: 'GET',
    };
              
    if (init.body) {
      console.log(`request: ${init.body}`)  
    }  
    
    const host = this.configuration.services.persistConnector.host;
    const port = this.configuration.services.persistConnector.port;
    //const url = 'http://' + host + ':' + port + '/';
    //const protocol = window.location.protocol;
    //const host = window.location.hostname;
    const url = host + ':' + port + '/';
    console.log(`Requesting from: ${url}`);
    this.requestResponseFromUrl(init, url, callback);
  }
  
  requestResponseFromUrl(init, url, callback) {
    var messages = document.getElementById('messages');

    fetch(url, init)
    .then(res => {
      if (res.ok) {
        return res.json();  
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

  handleSelectionClick = (event) => {

  }

  handleCreationClick = (event) => {
    var newmodel = document.getElementById('newmodel');

    var init = {
      method: 'PUT',
    };
              
    const host = this.configuration.services.persistConnector.host;
    const port = this.configuration.services.persistConnector.port;
    //const url = 'http://' + host + ':' + port + '/?host=' + newmodel.value + '.' + this.restBaseDomain;
    //const protocol = window.location.protocol;
    //const host = window.location.hostname;

    const url = host + ':' + port + '/?host=' + newmodel.value + '.' + this.restBaseDomain;
    console.log(`Requesting from: ${url}`);
    //const url = 'http://localhost:5001/?host=' + newmodel.value + '.' + this.restBaseDomain;
    
    this.requestResponseFromUrl(init, url, (data) => {
      console.log(data);
    });
  }
  
  render() {
    return (
      <section className="fullpane">
        <div className="connectbar">
          <div id="connectionPanel">
            <select name="models" id="models"></select>
            <ConnectDisconnectButton value="Select" disabled={() => false} onClick={() => this.handleSelectionClick()}/>
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
