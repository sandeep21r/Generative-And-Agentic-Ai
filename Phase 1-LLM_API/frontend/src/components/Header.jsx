import themeIcon from "../assets/themes.png";
import "./Header.css";
import ModelSelect from "./ModelSelect";

function Header({ onClearChat, isDarkMode, onToggleTheme, models, selectedModel, onModelChange }){
    return (
        <header className="HeaderContainer">
            <div className="HeaderLeft">
                <h3>LLM API</h3>
                <ModelSelect 
                    models={models}
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                />
            </div>
            <div className="HeaderRight">
                <div className="HeaderRightToggleButton">
                    <button onClick={onToggleTheme} className="HeaderRightToggleBut">
                        <img src={themeIcon} alt="Toggle theme" />
                    </button>
                </div>
                <div className="HeaderRightClearChatButton">
                    <button onClick={onClearChat} className="HeaderRightClearChatBut">
                        Clear Chat
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
