import { useEffect } from 'react';
import '../styles/AutoLaunchToggle.css';


interface AutoLaunchToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const AutoLaunchToggle: React.FC<AutoLaunchToggleProps> = ({
  enabled,
  onToggle
}) => {
  // Load saved state when component mounts
  useEffect(() => {
    chrome.storage.local.get(['autoLaunchEnabled'], (result) => {
      if (result.autoLaunchEnabled !== undefined) {
        onToggle(result.autoLaunchEnabled);
      }
    });
  }, []);

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
    chrome.storage.local.set({ autoLaunchEnabled: checked });
  };

  return (
    <div className="auto-launch-toggle">
      <label className="switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
      <span className="toggle-label">
        Auto-launch is {enabled ? 'enabled' : 'disabled'}
      </span>
    </div>
  );
};