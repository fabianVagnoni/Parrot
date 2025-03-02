import { useState, useEffect } from 'react';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const ThresholdSlider = ({ value, onChange }: ThresholdSliderProps) => {
  const [sliderValue, setSliderValue] = useState(value);
  
  // Update local state when prop changes
  useEffect(() => {
    setSliderValue(value);
  }, [value]);
  
  // Calculate the actual word threshold based on slider value (0-100)
  const calculateWordThreshold = (sliderVal: number) => {
    return Math.max(100, Math.round((1000 * sliderVal) / 100));
  };
  
  // Format the display value
  const displayValue = calculateWordThreshold(sliderValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setSliderValue(newValue);
    onChange(newValue); // Update immediately for smoother experience
  };
  
  return (
    <div className="threshold-slider">
      <div className="setting-label">
        <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>📊</span>
        <span>Word Threshold: <strong>{displayValue}</strong> words</span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min="10"
          max="100"
          value={sliderValue}
          onChange={handleChange}
          className="slider"
        />
        <div className="slider-description">
          Trigger task after reading {displayValue} words
        </div>
      </div>
    </div>
  );
}; 