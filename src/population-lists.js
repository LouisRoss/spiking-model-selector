import './App.css';

const PopulationSelectList = ({onChange, populationTemplates, findInterconnectIndex}) => {
  const generatePopulationName = (template) => {
    return template.population + '/' + template.template;
  }

  const generateLayerName = (template, layer) => {
    return layer.name + '@' + generatePopulationName(template);
  }
  const getClass = (layerName) => {
    const {fromToFlag, interconnectIndex} = findInterconnectIndex(layerName);
    if (fromToFlag === 0 || interconnectIndex === -1) {
      return "";
    }

    if (fromToFlag === 1) {
      return "from-index-" + interconnectIndex;
    }

    if (fromToFlag === 2) {
      return "to-index-" + interconnectIndex;
    }

    return "";
  }

  return (
    <select name="populationselectlist" id="populationselectlist" onChange={onChange} size="9">
      {populationTemplates.map(template => (
        <optgroup key={generatePopulationName(template)} label={template.population + ' --> ' + template.template}>
          {template.rawtemplate.neurons.map(layer => (
            <option   key={layer.name} className={getClass(generateLayerName(template, layer))} value={generateLayerName(template, layer)}>
              {layer.name}
            </option>)
          )} 
        </optgroup>
      ))}
    </select>
  );
}

const TemplateSelectList = ({onChange, templates}) => {
  return (
    <select name="templateselectlist" id="templateselectlist" onChange={onChange} size="9">
      {templates.map(element => (
        <option key={element} value={element}>{element}</option>
      ))}
    </select>
  );
}

export { PopulationSelectList, TemplateSelectList };
