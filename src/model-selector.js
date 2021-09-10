import { Component } from 'react';
import { Configuration } from './configuration/configuration.js';
import { Button } from 'react-bootstrap';
import { ConnectDisconnectButton } from './property-switch.js';
import './App.css';

class ModelSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: ['<none>'],
      modeltemplates: ['<none>'],
      models: ['<none>']
    };
    this.templateCount = 0;   // Incremented to use as key in modeltemplates select element.
    
    this.configuration = null;
    this.selectedModel = '';
  }

  componentDidMount() {
    if (!this.configuration) {
      Configuration.getInstance(configuration => {
        this.configuration = configuration;
        this.handleInitializeState();
      });
    } else {
      this.handleInitializeState();
    }
  }

  handleInitializeState() {
    console.log(this.configuration);
    this.packagerHost = this.configuration.services.modelPackager.host;
    this.packagerPort = this.configuration.services.modelPackager.port;
    this.basePackagerUrl = this.packagerHost + ':' + this.packagerPort;

    this.fetchModels();
  }

  fetchModels() {
    fetch(this.basePackagerUrl + '/models', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      this.setState({models: [...response] });
    });
  }

  handleSelectionClick = (event) => {
    fetch(this.basePackagerUrl + '/templates', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      this.setState({templates: [...response] });
    });

    this.selectedModel = document.getElementById("models").value;
    fetch(this.basePackagerUrl + '/model/' + this.selectedModel + '/templates', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      this.setState({modeltemplates: response });
    });
  }

  createOrDelete(method, model) {
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
          this.fetchModels();
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

  handleAddTemplateClick = () => {
    var templates = document.getElementById('templates');

    this.setState({modeltemplates: [...this.state.modeltemplates, templates.value]})
  }

  handleRemoveTemplateClick = () => {
    var modelTemplates = document.getElementById('modeltemplates');

    const modelTemplateIndex = modelTemplates.selectedIndex;

    this.state.modeltemplates.splice(modelTemplateIndex, 1);
    this.setState({modeltemplates: [...this.state.modeltemplates]})
  }

  handleApplyClick = () => {
    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(this.state.modeltemplates)
    };
    
    var messages = document.getElementById('messages');
    const pollComplete = (link) => {
      fetch(link, init)
      .then(data => data.json())
      .then(response => {
        if (response.completed) {
          response.results.forEach(result => messages.value += result + '\n');
          messages.value += response.status + '\n';
        } else {
          init.method = 'GET';
          init.body = null;
          setTimeout(pollComplete, 200, response.link);
        }

        var stausbar = document.getElementById('status');
        stausbar.value = response.status;
      });
    }

    console.log(`PUTting package command for templates ${JSON.stringify(this.state.modeltemplates)}`);
    pollComplete(this.basePackagerUrl + '/package/' + this.selectedModel);
  }

  render() {
    return (
      <section className="fullpane">
        <div className="connectbar">
          <div className="modelLabel">Models</div>
          <div id="connectionPanel">
            <select name="models" id="models">
              {this.state.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <ConnectDisconnectButton value="Select" disabled={() => false} onClick={() => this.handleSelectionClick()}/>
            <ConnectDisconnectButton value="Delete" disabled={() => false} onClick={(event) => this.handleDeletionClick(event)}/>
            <input id="newmodel" type="text"></input>
            <ConnectDisconnectButton value="Create" disabled={() => false} onClick={() => this.handleCreationClick()}/>
          </div>

          <div className="messagebar">
            <div className="messages">
              <div className="templatesLabel">Templates</div>
              <div className="templates">
                <select className="templates" id="templates" size="10">
                  {this.state.templates.map(element => (
                    <option key={element} value={element}>{element}</option>
                  ))}
                </select>
                <div className="template-arrows">
                  <Button variant="btn outline-primary" onClick={() => this.handleAddTemplateClick()}>&gt;</Button>
                  <Button variant="btn outline-primary" onClick={() => this.handleRemoveTemplateClick()}>&lt;</Button>
                </div>
                <select className="templates" id="modeltemplates" size="10">
                  {this.state.modeltemplates.map(element => (
                    <option key={this.templateCount++} value={element}>{element}</option>
                  ))}
                </select>
                <ConnectDisconnectButton value="Apply" disabled={() => false} onClick={() => this.handleApplyClick()}/>
              </div>
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
