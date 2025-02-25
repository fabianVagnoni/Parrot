import React, { useRef } from 'react';
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
  const languages = CONFIG.SUPPORTED_LANGUAGES;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLanguageSelect = (language: string) => {
    onLanguageSelect(language);
    setIsOpen(false);
  };

  return (
    <div className="dropdown" style={{ position: 'relative' }}>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: '2px solid #3498db',
          backgroundColor: 'white',
          color: '#3498db',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = '#3498db';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = '#3498db';
        }}
      >
        {selectedLanguage}
      </button>
      {isOpen && (
        <ul className="dropdown-menu" style={{
          listStyle: "none",
          padding: "0.2rem 0.5rem",
          border: "1px solid #ddd",
          position: "absolute",
          boxShadow: "0 -0.5rem 1rem rgba(0, 0, 0, 0.1)",
          borderRadius: "0.5rem",
          width: "100%",
          bottom: "calc(100% + 0.5rem)", // Position above the button
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          zIndex: "1",
          maxHeight: "200px",
          overflowY: "auto"
        }}>
          {languages.map((language: string) => (
            <li 
              key={language}
              onClick={() => handleLanguageSelect(language)}
              style={{
                padding: "0.7rem",
                cursor: "pointer",
                borderRadius: "0.3rem",
                transition: "background-color 0.2s ease"
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