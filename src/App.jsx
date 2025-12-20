import React from 'react';
import { useTaste } from './contexts/TasteContext';
import Welcome from './components/Welcome/Welcome';
import PhaseOne from './components/PhaseOne/PhaseOne';
import PhaseTwo from './components/PhaseTwo/PhaseTwo';
import PhaseThree from './components/PhaseThree/PhaseThree';
import Completion from './components/Completion/Completion';

const App = () => {
  const { currentPhase } = useTaste();
  
  const renderPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return <Welcome />;
      case 'phase1':
        return <PhaseOne />;
      case 'phase2':
        return <PhaseTwo />;
      case 'phase3':
        return <PhaseThree />;
      case 'complete':
        return <Completion />;
      default:
        return <Welcome />;
    }
  };
  
  return (
    <div className="app">
      {renderPhase()}
    </div>
  );
};

export default App;
