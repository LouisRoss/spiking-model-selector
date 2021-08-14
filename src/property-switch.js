import { Component } from 'react';
import Switch from "react-switch";

class PropertySwitch extends Component {
    render() {
      return (
          <label className="property-switch" htmlFor="material-switch">
            <span className="control-label">{this.props.value}</span>
            <span className="control-value">{this.props.label}</span>
  
            <Switch
              checked={this.props.isChecked()}
              onChange={this.props.onChange}
              onColor="#86d3ff"
              onHandleColor="#2693e6"
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={20}
              width={36}
              className="react-switch control"
              id="material-switch"
              disabled={!this.props.connected}
            />
          </label>
      );
    }
  }

  
  class ConnectDisconnectButton extends Component {
    render() {
      return (
        <button 
          id="connectButton" 
          className="connect-disconnect" 
          disabled={this.props.disabled()} 
          style={{opacity: (this.props.disabled()? 0.3 : 1.0)}}
          onClick={this.props.onClick}>
            {this.props.value}
        </button>
      );
    }
  }
  
    
export { PropertySwitch, ConnectDisconnectButton };
