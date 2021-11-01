import { Component } from 'react';
import { ModelManager } from './model-manager.js';
import { PopulationManager } from './population-manager.js';
import './App.css';


class ModelSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedModel: ''
    };
  }

  handleSelectionClick = (selectedModel) => {
    this.setState({selectedModel: selectedModel});
  }

  render() {
    return (
      <section className="fullpane">
        <div className="connectbar">
          <div className="modelLabel">Model Management and Launcher</div>
          <div id="connectionPanel">
          </div>

          <div className="messagebar">
            <div className="messages">
              <div className="templatesLabel">Select a Model -> Add, Modify, or Delete Population(Template)s -> Apply</div>
              <div className="templates">
                <ModelManager onSelectClick={this.handleSelectionClick} />
                <PopulationManager selectedModel={this.state.selectedModel} />
              </div>
              <textarea name="messages" id="messages" cols="120" rows="15" readOnly></textarea>
              <textarea name="status" id="status" cols="120" rows="5" readOnly></textarea>
            </div>
          </div>

        </div>
      </section>
    );
  }
}

export { ModelSelector };
