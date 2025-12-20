import React from 'react';

const ProgressIndicator = ({ current, total, percentage }) => {
  return (
    <div className="progress-indicator">
      <div className="progress-indicator__bar">
        <div 
          className="progress-indicator__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-indicator__text">
        <span className="progress-indicator__count">{current} / {total}</span>
        <span className="progress-indicator__percentage">{percentage}%</span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
