import React, { useState, useEffect } from 'react';
import { SMUQuizStats } from '../utils/interfaces';
import { getQuizStats } from '../services/saveQuizResults';
import '../styles/WordHistory.css';

interface WordHistoryProps {
  statsVersion: number; // To trigger re-renders when stats change
}

export const WordHistory: React.FC<WordHistoryProps> = ({ statsVersion }) => {
  const [stats, setStats] = useState<SMUQuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await getQuizStats();
        setStats(result);
        
        // Extract unique languages from results
        if (result && result.results) {
          const languages = [...new Set(result.results.map(r => r.language))];
          setAvailableLanguages(languages);
        }
      } catch (err) {
        setError('Failed to load word history');
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [statsVersion]);

  if (loading) {
    return <div className="history-message">Loading word history...</div>;
  }

  if (error) {
    return <div className="history-message error">{error}</div>;
  }

  if (!stats || !stats.results || stats.results.length === 0) {
    return <div className="history-message">No word history available</div>;
  }

  // Filter results based on current filters
  const filteredResults = stats.results
    .filter(result => {
      if (filter === 'all') return true;
      if (filter === 'correct') return result.correct;
      if (filter === 'incorrect') return !result.correct;
      return true;
    })
    .filter(result => {
      if (languageFilter === 'all') return true;
      return result.language === languageFilter;
    })
    // Sort by timestamp (most recent first)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="history-container">
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button 
          className="settings-toggle" 
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? 'Hide History' : 'Show History'}</span>
          <span className={`settings-toggle-icon ${expanded ? 'expanded' : ''}`}>
            {expanded ? '▲' : '▼'}
          </span>
        </button>
      </div>
      
      <div className="section-content" style={{ 
        maxHeight: expanded ? '1000px' : '0',
        opacity: expanded ? 1 : 0,
        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out'
      }}>
        <div className="history-filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as 'all' | 'correct' | 'incorrect')}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="correct">Correct</option>
              <option value="incorrect">Incorrect</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Language:</label>
            <select 
              value={languageFilter} 
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="history-list">
          {filteredResults.length === 0 ? (
            <div className="history-empty">No results match your filters</div>
          ) : (
            filteredResults.map((result, index) => (
              <div 
                key={`${result.word}-${result.timestamp}-${index}`} 
                className={`history-item ${result.correct ? 'correct' : 'incorrect'}`}
              >
                <div className="history-word">
                  {result.word}
                  {result.translatedWord && (
                    <span className="history-translation">
                      → {result.translatedWord}
                    </span>
                  )}
                </div>
                <div className="history-details">
                  <span className="history-language">{result.language}</span>
                  <span className="history-result">{result.correct ? '✓ Correct' : '✗ Incorrect'}</span>
                  <span className="history-date">
                    {new Date(result.timestamp).toLocaleDateString()} 
                    {' '}
                    {new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 