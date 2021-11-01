import { useState, useEffect } from 'react';
import { ConnectDisconnectButton } from './property-switch.js';
import './App.css';
import configuration from './configfiles/configuration.json';
const basePackagerUrl = configuration.services.modelPackager.host + ':' + configuration.services.modelPackager.port;


const PopulationManager = ({selectedModel}) => {
  const [populationTemplates, setPopulationTemplates] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [templates, setTemplates] = useState(['<none>']);
  const [templatesShown, setTemplatesShown] = useState(false);
  const [createButtonDisabled, setCreateButtonDisabled] = useState(true);
  const [upDownDeleteButtonsDisabled, setUpDownDeleteButtonsDisabled] = useState(true);
  const [templateId, setTemplateId] = useState(0);

  // Reload the populations for the selected model when the selected model changes.
  useEffect(() => {
    const messages = document.getElementById('messages');
    if (selectedModel && selectedModel !== '') {
      fetch(basePackagerUrl + '/model/' + selectedModel + '/population', { method: 'GET', mode: 'cors' })
      .then(data => data.json())
      .then(response => {
        if (messages) {
          messages.value += `Retrieved configured populations for model '${selectedModel}'\n`
        }
        response.templates.forEach((value, index) => value.id = index);
        setTemplateId(response.templates.length);
        setPopulationTemplates(response.templates);
        evaluateUpDownDeleteButtonsDisabled();
        setDirty(false);
      });
    }
  }, [selectedModel]);

  // Reload all templates just once.
  useEffect(() => {
    const messages = document.getElementById('messages');
    fetch(basePackagerUrl + '/templates', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      if (messages) {
        messages.value += 'Retrieved available templates\n'
      }
      setTemplates([...response]);
    });
  }, []);

  // Miscellaneous list click events, text change events, etc.
  const handleTemplateSelectClick = () => {
    document.getElementById("newtemplate").value = document.getElementById("templateselectlist").value;
    evaluateCreateButtonDisabled();
  }

  const handlePopulationTextChange = () => {
    setTemplatesShown(document.getElementById("newpopulation").value.length !== 0);
  }

  const handlePopulationSelectedClick = () => {
    evaluateUpDownDeleteButtonsDisabled();
  }

  // The four main population editing button click events.
  const handleCreateButtonClick = () => {
    const newPopulationElement = document.getElementById("newpopulation");
    const newTemplateElement = document.getElementById("newtemplate");
    var workingTemplates = [...populationTemplates];
    workingTemplates.push({'population': newPopulationElement.value, 'template': newTemplateElement.value, 'id': templateId});
    setTemplateId(templateId + 1);
    setPopulationTemplates(workingTemplates);
    setDirty(true);

    newPopulationElement.value = '';
    newTemplateElement.value = '';
    setTemplatesShown(false);
    document.getElementById("templateselectlist").selectedIndex = -1;
    evaluateCreateButtonDisabled();
  }

  const handleUpButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1 && selectedIndex > 0) {
        var workingTemplates = [...populationTemplates];
        const removed = workingTemplates.splice(selectedIndex, 1);
        workingTemplates.splice(selectedIndex - 1, 0, removed[0]);
        setPopulationTemplates(workingTemplates);
        setDirty(true);
      }
    }
  }

  const handleDownButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1 && selectedIndex < populationTemplates.length - 1) {
        var workingTemplates = [...populationTemplates];
        const removed = workingTemplates.splice(selectedIndex, 1);
        workingTemplates.splice(selectedIndex + 1, 0, removed[0]);
        setPopulationTemplates(workingTemplates);
        setDirty(true);
      }
    }
  }

  const handleDeleteButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1) {
        var workingTemplates = [...populationTemplates];
        workingTemplates.splice(selectedIndex, 1);
        setPopulationTemplates(workingTemplates);
        setDirty(true);
      }
  
      populationsSelectListElement.selectedIndex = -1;
      evaluateUpDownDeleteButtonsDisabled();
    }
  }

  // The apply button event.
  const handleApplyClick = () => {
    var populationsAndTemplates = [];
    populationTemplates.forEach(pop => {
      populationsAndTemplates.push(pop.population + '/' + pop.template);
    });  

    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(populationsAndTemplates)
    };
    
    var messages = document.getElementById('messages');
    const pollComplete = (link) => {
      fetch(link, init)
      .then(data => data.json())
      .then(response => {
        if (response.completed) {
          response.results.forEach(result => messages.value += result + '\n');
          messages.value += response.status + '\n';
          setDirty(false);
        } else {
          init.method = 'GET';
          init.body = null;
          setTimeout(pollComplete, 200, response.link);
        }

        var statusbar = document.getElementById('status');
        statusbar.value = response.status;
      });
    }

    console.log(`PUTting package command for ${populationTemplates.length} populations in ${selectedModel}`);
    pollComplete(basePackagerUrl + '/package/' + selectedModel);
  }

  // Evaluate control enable flags.
  const evaluateCreateButtonDisabled = () => {
    const newPopulationElement = document.getElementById("newpopulation");
    const newTemplateElement = document.getElementById("newtemplate");
    var disabled = true;
    if (newPopulationElement && newTemplateElement) {
      disabled = newPopulationElement.value.length === 0 || newTemplateElement.value.length === 0;
    }

    setCreateButtonDisabled(disabled);
  }

  const evaluateUpDownDeleteButtonsDisabled = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    var disabled = true;
    if (populationsSelectListElement) {
      disabled = populationsSelectListElement.selectedIndex === -1;
    }

    setUpDownDeleteButtonsDisabled(disabled);
  }

  return (
    <div className="population-manager">
      <div className="population-management">
        <label>Population</label>
        <div className="population-group" id="population-group">
          <div className="population-controls">
            <ConnectDisconnectButton ident="createbutton" value="Create" disabled={() => createButtonDisabled} onClick={handleCreateButtonClick}/>
            <ConnectDisconnectButton ident="upbutton" value="^ Up" disabled={() => upDownDeleteButtonsDisabled} onClick={handleUpButtonClick}/>
            <ConnectDisconnectButton ident="downbutton" value="&#8964; Down" disabled={() => upDownDeleteButtonsDisabled} onClick={handleDownButtonClick}/>
            <ConnectDisconnectButton ident="deletebutton" value="Delete" disabled={() => upDownDeleteButtonsDisabled} onClick={handleDeleteButtonClick}/>
          </div>
          <div className="population-controls">
            <input id="newpopulation" type="text" onInput={handlePopulationTextChange}></input>
            <select name="populationselectlist" id="populationselectlist" onChange={handlePopulationSelectedClick} size="9">
              {populationTemplates.map(template => (
                <option key={template.id} value={template.population}>{template.population + " (" + template.template + ")"}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="template-management">
        <label id="template-label">Template</label>
        <div className="template-group" id="template-group">
          { templatesShown ? <div className="template-selector">
            <input id="newtemplate" type="text" disabled={true}></input>
            <select name="templateselectlist" id="templateselectlist" onChange={handleTemplateSelectClick} size="9">
              {templates.map(element => (
                <option key={element} value={element}>{element}</option>
              ))}
            </select>
          </div> : null }
        </div>
      </div>
      <ConnectDisconnectButton value="Apply" disabled={() => !dirty} onClick={() => handleApplyClick()}/>
    </div>
  );
}


export { PopulationManager };
