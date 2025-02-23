import React, { useState, useEffect } from 'react';
import { getQuizStats } from './saveQuizResults';
import { QuizStats as StatsType } from '../utils/interfaces';
import '../styles/QuizStats.css';

export const QuizStats: React.FC = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getQuizStats();
        setStats(result);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="stats-message">Loading statistics...</div>;
  }

  if (error) {
    return <div className="stats-message error">{error}</div>;
  }

  if (!stats) {
    return <div className="stats-message">No statistics available</div>;
  }

  const score = stats.correctAnswers - stats.incorrectAnswers;
  const accuracy = stats.totalAttempts > 0 
    ? ((stats.correctAnswers / stats.totalAttempts) * 100).toFixed(1)
    : '0';

  return (
    <div className="stats-container">
      <div className="score-section">
        <h3 className="score-title">Score: <span className={score >= 0 ? 'positive' : 'negative'}>{score}</span></h3>
        <div className="button-section">
          <button 
            className="expand-button"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide Statistics' : 'Expand Statistics'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="expanded-stats">
          <div className="stats-grid">
            <div className="stats-item">
              <span>Total Attempts:</span> {stats.totalAttempts}
            </div>
            <div className="stats-item">
              <span>Correct Answers:</span> {stats.correctAnswers}
            </div>
            <div className="stats-item">
              <span>Incorrect Answers:</span> {stats.incorrectAnswers}
            </div>
            <div className="stats-item">
              <span>Accuracy:</span> {accuracy}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};