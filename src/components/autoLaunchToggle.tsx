import { useEffect } from 'react';
// Remove CSS import and use inline styles instead
// import '../styles/autoLaunchToggle.css';

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

  // Inline styles to exactly match the QuizModeToggle appearance
  const toggleStyles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
      backgroundColor: 'transparent',
    },
    switch: {
      position: 'relative' as const,
      display: 'inline-block',
      width: '46px',
      height: '24px',
    },
    input: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    slider: {
      position: 'absolute' as const,
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: enabled ? '#2196F3' : '#ccc',
      transition: '.4s',
      borderRadius: '24px',
    },
    sliderBefore: {
      position: 'absolute' as const,
      content: '""',
      height: '18px',
      width: '18px',
      left: enabled ? '25px' : '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%',
    },
    label: {
      fontSize: '0.8rem',
      color: '#666',
    }
  };

  return (
    <div style={toggleStyles.container}>
      <label style={toggleStyles.switch}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          style={toggleStyles.input}
        />
        <span style={{...toggleStyles.slider}}>
          <span style={toggleStyles.sliderBefore}></span>
        </span>
      </label>
      <span style={toggleStyles.label}>
        Auto-launch is {enabled ? 'enabled' : 'disabled'}
      </span>
    </div>
  );
};