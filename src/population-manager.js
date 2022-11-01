import { useState, useEffect } from 'react';
import { ConnectDisconnectButton } from './property-switch.js';
import { PopulationSelectList, TemplateSelectList } from './population-lists.js'
import { InterconnectButton } from './interconnect-button.js';
import './App.css';
import configuration from './configfiles/configuration.json';
const basePackagerUrl = configuration.services.modelPackager.host + ':' + configuration.services.modelPackager.port;


var interconnectFrom = "";
var interconnectTo = "";
var nextInterconnectPhase = 0;


const PopulationManager = ({selectedModel}) => {
  const [populationTemplates, setPopulationTemplates] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [redraw, setRedraw] = useState(false);
  const [templates, setTemplates] = useState(['<none>']);
  const [templatesShown, setTemplatesShown] = useState(false);
  const [createButtonDisabled, setCreateButtonDisabled] = useState(true);
  const [upDownDeleteButtonsDisabled, setUpDownDeleteButtonsDisabled] = useState(true);
  const [interconnectButtonDisabled, setInterconnectButtonDisabled] = useState(true);
  const [interconnectInstructions, setInterconnectInstructions] = useState("");
  const [interconnectPhase, setInterconnectPhase] = useState(0);
  const [interconnectText, setInterconnectText] = useState("Create");
  const [interconnections, setInterconnections] = useState([]);
  const [templateId, setTemplateId] = useState(0);

  // Reload the populations for the selected model when the selected model changes.
  useEffect(() => {
    console.log(`Effect running because selectedModel changed to ${selectedModel}`);
    const messages = document.getElementById('messages');
    if (selectedModel && selectedModel !== '') {
      fetch(basePackagerUrl + '/model/' + selectedModel + '/model', { method: 'GET', mode: 'cors' })
      .then(data => data.json())
      .then(response => {
        if (messages) {
          messages.value += `Retrieved configured populations for model '${selectedModel}'\n`
        }
        if (response.length > 0) {
          response.forEach((value, index) => {
            value.id = index;
            /*
            var layers = [];
            for (var layerName in value.indexes) {
              layers.push(layerName);
            }
            value.layers = layers;
            */
          });
          setTemplateId(response.length);
          setPopulationTemplates(response);
        }
        else {
          setTemplateId(0);
          setPopulationTemplates([]);
        }

        fetch(basePackagerUrl + '/model/' + selectedModel + '/interconnects', { method: 'GET', mode: 'cors' })
        .then(idata => idata.json())
        .then(iresponse => {
          if (messages) {
            messages.value += `Retrieved configured interconnects for model '${selectedModel}'\n`
          }
          console.log(iresponse.result);
          setInterconnections([...iresponse]);
        });
  
        evaluateUpDownDeleteButtonsDisabled();
        evaluateInterconnectButtonDisabled(selectedModel);
        setInterconnectInstructions("");
        setInterconnectPhase(0);
        setInterconnectText("Create");
        setDirty(false);
      });
    }
    else {
      setTemplateId(0);
      setPopulationTemplates([]);
      evaluateUpDownDeleteButtonsDisabled();
      evaluateInterconnectButtonDisabled(selectedModel);
      setInterconnections([]);
      setDirty(false);
  }
}, [selectedModel, redraw]);

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

  const handleCreateButtonClick = () => {
    const newPopulationElement = document.getElementById("newpopulation");
    const newTemplateElement = document.getElementById("newtemplate");
    var workingTemplates = [...populationTemplates];
    workingTemplates.push({'population': newPopulationElement.value, 'template': newTemplateElement.value, 'id': templateId, 'rawtemplate': {'neurons': [{'name': 'Not Resolved'}]}});
    setTemplateId(templateId + 1);
    setPopulationTemplates(workingTemplates);
    setDirty(true);

    newPopulationElement.value = '';
    newTemplateElement.value = '';
    setTemplatesShown(false);
    document.getElementById("templateselectlist").selectedIndex = -1;
    evaluateCreateButtonDisabled();
  }

  // The four main population editing button click events.
  const handleUpButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1 && selectedIndex > 0) {
        const populationIndex = findPopulationIndex(selectedIndex);
        var workingTemplates = [...populationTemplates];
        const removed = workingTemplates.splice(populationIndex, 1);
        workingTemplates.splice(populationIndex - 1, 0, removed[0]);
        setPopulationTemplates(workingTemplates);
        setDirty(true);
      }
    }
  }

  const handleDownButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1) {
        const populationIndex = findPopulationIndex(selectedIndex);
        if (populationIndex < populationTemplates.length - 1) {
          var workingTemplates = [...populationTemplates];
          const removed = workingTemplates.splice(populationIndex, 1);
          workingTemplates.splice(populationIndex + 1, 0, removed[0]);
          setPopulationTemplates(workingTemplates);
          setDirty(true);
        }
      }
    }
  }

  const handleDeleteButtonClick = () => {
    const populationsSelectListElement = document.getElementById("populationselectlist");
    if (populationsSelectListElement) {
      const selectedIndex = populationsSelectListElement.selectedIndex;
      if (selectedIndex !== -1) {
        const populationIndex = findPopulationIndex(selectedIndex);
        var workingTemplates = [...populationTemplates];
        workingTemplates.splice(populationIndex, 1);
        setPopulationTemplates(workingTemplates);
        setDirty(true);
      }
  
      populationsSelectListElement.selectedIndex = -1;
      evaluateUpDownDeleteButtonsDisabled();
    }
  }

  // The interconnect phases.
  const handlePopulationSelectedClick = () => {
    const selectedLayer = document.getElementById("populationselectlist").value;
    console.log('selected: ' + selectedLayer);
    const {fromToFlag, interconnectIndex} = findInterconnectIndex(selectedLayer);

    if (interconnectPhase === 0) {
      var instructions = "";
      if (fromToFlag !== 0) {
        const interconnect = interconnections[interconnectIndex];
        instructions = "\nFrom: " + interconnect.From;
        instructions += "\nTo:  " + interconnect.To;
        instructions += "\n";
      }

      setInterconnectInstructions(instructions);
    }
    else if (interconnectPhase === 1) {
      if (fromToFlag !== 0) {
        interconnectFrom = "already used";
      }
      else
      {
        interconnectFrom = selectedLayer;
        nextInterconnectPhase = 2;
      }

      generateInterconnectState();
    }
    else if (interconnectPhase === 2) {
      if (fromToFlag !== 0) {
        interconnectTo = "already used";
      }
      else
      {
        interconnectTo = selectedLayer;
        nextInterconnectPhase = 3;
      }

      generateInterconnectState();
    }

    evaluateUpDownDeleteButtonsDisabled();
  }

  const handleInterconnectButtonClick = () => {
    console.log("interconnect");
    if (interconnectPhase === 0) {
      // The button is labeled 'create'.
      interconnectFrom = "";
      interconnectTo = "";
      nextInterconnectPhase = 1;
      setInterconnectText("Cancel");
      document.getElementById("populationselectlist").selectedIndex = -1;
    }
    else {
      // The button is labeled 'cancel'.
      interconnectFrom = "";
      interconnectTo = "";
      nextInterconnectPhase = 0;
      setInterconnectText("Create");
      document.getElementById("populationselectlist").selectedIndex = -1;
    }

    generateInterconnectState();
  }

  const handleInterconnectApplyButtonClick = () => {
    if (interconnectPhase === 3) {
      setInterconnections([...interconnections, {"From": interconnectFrom, "To": interconnectTo}]);
      setDirty(true);
      
      interconnectFrom = "";
      interconnectTo = "";
      nextInterconnectPhase = 0;
      setInterconnectText("Create");
      document.getElementById("populationselectlist").selectedIndex = -1;
      generateInterconnectState();
    }
  }

  const handleInterconnectDeleteButtonClick = () => {
    const selectedLayer = document.getElementById("populationselectlist").value;
    var connections = [...interconnections];
    const len = connections.length;

    for(var i = 0; i < len; i++ )
      if (connections[i].From !== selectedLayer && connections[i].To !== selectedLayer) {
        connections.push(connections[i]);
      }

    connections.splice(0 , len);  // cut the array and leave only the non-empty values
    setInterconnections(connections);
    setDirty(true);
  }

  const generateInterconnectState = () => {
    var instructions = "";

    if (nextInterconnectPhase > 0) {
      instructions = "\nFrom: ";
      instructions += interconnectFrom === "" ? "xxxxxxxx" : interconnectFrom;
      instructions += "\nTo:  ";
      instructions += interconnectTo === "" ? "xxxxxxxx" : interconnectTo;
      instructions += "\n";
  
      if (nextInterconnectPhase === 1) {
        instructions += "<-- Select a 'From' layer";
      }
      else if (nextInterconnectPhase === 2) {
        instructions += "<-- Select a 'To' layer";
      }
    }

    setInterconnectPhase(nextInterconnectPhase);
    setInterconnectInstructions(instructions);
  }

  const evaluateInterconnectButtonDisabled = () => {
    setInterconnectButtonDisabled(!selectedModel || selectedModel === '');
  }

  const evaluateInterconnectApplyButtonDisabled = () => {
    return nextInterconnectPhase !== 3;
  }

  const evaluateInterconnectDeleteButtonDisabled = () => {
    const populationSelectListElement = document.getElementById("populationselectlist");
    if (populationSelectListElement) {
      if (populationSelectListElement.selectedIndex !== -1) {
        const selectedLayer = document.getElementById("populationselectlist").value;
        const {fromToFlag, } = findInterconnectIndex(selectedLayer);
  
        return fromToFlag === 0;
      }
    }

    return true;
  }

  const findPopulationIndex = (selectedIndex) => {
    var populationIndex = 0;
    var totalTemplates = 0;
    populationTemplates.every(template => {
      totalTemplates += template.rawtemplate.neurons.length;
      if (selectedIndex < totalTemplates) {
        return false;
      }
      populationIndex++;
      return true;
    });

    return populationIndex;
  }

  const findInterconnectIndex = (layerName) => {
    var interconnectIndex = -1;
    var fromToFlag = 0;

    interconnections.every((interconnection, index) => {
      if (layerName === interconnection.From) {
        fromToFlag = 1;
        interconnectIndex = index;
        return false;
      }

      if (layerName === interconnection.To) {
        fromToFlag = 2;
        interconnectIndex = index;
        return false;
      }

      return true;
    });

    return {fromToFlag, interconnectIndex};
  }

  // The apply button event.
  const handleApplyClick = () => {
    writeInterconnects(success => {
      if (success) {
        writePopulationsAndTemplates(success => {
          if (success) {
            setDirty(false);
            setRedraw(!redraw);
          }
        });
      }
    });
  }

  const writeInterconnects = (onDone) => {
    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(interconnections)
    };
    
    var messages = document.getElementById('messages');

    fetch(basePackagerUrl + '/model/' + selectedModel + "/interconnects", init)
    .then(data => data.json())
    .then(response => {
      if (response.status === 201) {
        messages.value += 'Wrote model interconnects with status ' + response.status;
        onDone(true);
      }
      else {
        messages.value += 'Error writing model interconnects with status ' + response.status;
        onDone(false);
      }
    });
  }

  const writePopulationsAndTemplates = (onDone) => {
    var populationsAndTemplates = [];
    populationTemplates.forEach(pop => {
      populationsAndTemplates.push(pop.population + '/' + pop.template);
    });  

    var messages = document.getElementById('messages');

    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(populationsAndTemplates)
    };
    
    const pollComplete = (link) => {
      fetch(link, init)
      .then(data => data.json())
      .then(response => {
        if (response.completed) {
          response.results.forEach(result => messages.value += result + '\n');
          messages.value += response.status + '\n';
          onDone(true);
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
    if (populationsSelectListElement && interconnectPhase === 0) {
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
            <PopulationSelectList populationTemplates={populationTemplates}  onChange={handlePopulationSelectedClick} findInterconnectIndex={findInterconnectIndex}/>
          </div>
          <div className="population-interconnect">
            <div>Interconnect</div>
            <div className="interconnect-buttons">
              <InterconnectButton buttonId="interconnect" disabledFunc={interconnectButtonDisabled} onClick={handleInterconnectButtonClick} text={interconnectText}/>
              <InterconnectButton buttonId="interconnect-apply" disabledFunc={evaluateInterconnectApplyButtonDisabled()} onClick={handleInterconnectApplyButtonClick} text="Apply"/>
            </div>
            <div className="population-interconnect-instructions">{interconnectInstructions}</div>
            <div className="population-interconnect-placeholder" />
            <InterconnectButton buttonId="interconnect-delete" disabledFunc={evaluateInterconnectDeleteButtonDisabled()} onClick={handleInterconnectDeleteButtonClick} text="Delete"/>
          </div>
        </div>
      </div>
      <div className="template-management">
        <label id="template-label">Template</label>
        <div className="template-group" id="template-group">
          { templatesShown ? <div className="template-selector">
            <input id="newtemplate" type="text" disabled={true}></input>
            <TemplateSelectList templates={templates} onChange={handleTemplateSelectClick} />
          </div> : null }
        </div>
      </div>
      <ConnectDisconnectButton value="Apply" disabled={() => !dirty} onClick={() => handleApplyClick()}/>
    </div>
  );
}


export { PopulationManager };
