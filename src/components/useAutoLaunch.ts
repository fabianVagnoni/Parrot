import { useEffect, useState } from 'react';
import { CONFIG } from '../config/constants';

export const useAutoLaunch = (
  autoLaunchEnabled: boolean,
  onLaunch: () => void
) => {
  const [lastPageUrl, setLastPageUrl] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkAndSetTimer = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || '';

      if (autoLaunchEnabled && currentUrl !== lastPageUrl) {
        setLastPageUrl(currentUrl);
        timer = setTimeout(onLaunch, CONFIG.AUTO_LAUNCH_DELAY);
      }
    };

    const tabChangeListener = () => {
      checkAndSetTimer();
    };

    if (autoLaunchEnabled) {
      chrome.tabs.onActivated.addListener(tabChangeListener);
      chrome.tabs.onUpdated.addListener(tabChangeListener);
      checkAndSetTimer();
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (autoLaunchEnabled) {
        chrome.tabs.onActivated.removeListener(tabChangeListener);
        chrome.tabs.onUpdated.removeListener(tabChangeListener);
      }
    };
  }, [autoLaunchEnabled, lastPageUrl, onLaunch]);
};