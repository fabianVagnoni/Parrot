import React from 'react';
import '../styles/QuizModeToggleSMU.css';

interface QuizModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const QuizModeToggle: React.FC<QuizModeToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="quiz-mode-toggle">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
      <span className="toggle-label">
        {enabled ? 'Test Mode' : 'Practice Mode'}
      </span>
    </div>
  );
};