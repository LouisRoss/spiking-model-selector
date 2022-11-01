const InterconnectButton = ({buttonId, disabledFunc, onClick, text}) => {

    return (
        <button type="button" className="population-interconnect" id={buttonId}
        disabled={disabledFunc} 
        style={{opacity: (disabledFunc? 0.3 : 1.0)}}
        onClick={onClick}>
            {text}
        </button>
    );
}

export { InterconnectButton };
