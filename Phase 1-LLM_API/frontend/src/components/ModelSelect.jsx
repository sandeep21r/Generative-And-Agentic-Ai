import { useState, useEffect, useRef } from "react";
import "./ModelSelect.css";

function ModelSelect({ models, selectedModel, onModelChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (model) => {
        onModelChange(model);
        setIsOpen(false);
    };

    return (
        <div className="ModelSelectContainer" ref={containerRef}>
            <button 
                className="ModelSelectTrigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedModel}</span>
                <span className="ModelSelectArrow">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <ul className="ModelSelectOptions">
                    {models.map((model) => (
                        <li 
                            key={model}
                            className={`ModelSelectOption ${model === selectedModel ? "selected" : ""}`}
                            onClick={() => handleSelect(model)}
                        >
                            {model}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ModelSelect;