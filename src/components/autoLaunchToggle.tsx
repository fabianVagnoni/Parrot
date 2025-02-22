import React from "react";

interface AutoLaunchToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const AutoLaunchToggle: React.FC<AutoLaunchToggleProps> = ({
  enabled,
  onToggle
}) => {
  return (
    <div className="auto-launch-toggle">
      <label className="switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
      <span className="toggle-label">
        Auto-launch is {enabled ? 'enabled' : 'disabled'}
      </span>
    </div>
  );
};