import React from 'react';
import { CONFIG } from '../config/constants.ts';

interface LanguageDropdownProps {
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  selectedLanguage,
  onLanguageSelect
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const languages = CONFIG.SUPPORTED_LANGUAGES; // Assuming this exists in CONFIG

  const handleLanguageSelect = (language: string) => {
    onLanguageSelect(language);
    setIsOpen(false);
  };

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        {selectedLanguage}
      </button>
      {isOpen && (
        <ul className="dropdown-menu" style={{
          listStyle: "none",
          padding: "0.2rem 0.5rem",
          border: "2px solid",
          position: "absolute",
          boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.2)",
          borderRadius: "0.5rem",
          width: "100%",
          top: "3rem",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          zIndex: "1",
        }}>
          {languages.map((language: string) => (
            <li 
              key={language}
              onClick={() => handleLanguageSelect(language)}
              style={{
                padding: "0.7rem",
                cursor: "pointer",
                borderRadius: "0.3rem",
              }}
              onMouseOver={(e: React.MouseEvent<HTMLLIElement>) => {
                (e.target as HTMLLIElement).style.backgroundColor = "#f0f0f0";
              }}
              onMouseOut={(e: React.MouseEvent<HTMLLIElement>) => {
                (e.target as HTMLLIElement).style.backgroundColor = "transparent";
              }}
            >
              {language}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};