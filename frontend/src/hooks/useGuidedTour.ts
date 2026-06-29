import { useCallback, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useGuidedTour() {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const startTour = useCallback(() => {
    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.85)',
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: 'codeatlas-tour',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Got it',
      onDestroyStarted: () => {
        setActiveStep(null);
        d.destroy();
      },
      onHighlightStarted: (element) => {
        setActiveStep(element?.id || null);
      },
      steps: [
        {
          element: '#tour-header',
          popover: {
            title: 'Analysis Complete',
            description: 'Your repository was analyzed by 7 parallel AI agents powered by Cerebras Gemma 4. Let\'s explore the results.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-stats',
          popover: {
            title: 'Engineering Metrics',
            description: 'Key metrics extracted from your codebase: files, services, endpoints, dependencies, and potential vulnerabilities.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-health',
          popover: {
            title: 'Health Score',
            description: 'Overall repository health calculated from all agent scores. Each metric is independently evaluated by a specialist agent.',
            side: 'right',
          },
        },
        {
          element: '#tour-agents',
          popover: {
            title: 'AI Specialist Agents',
            description: 'Each card represents a dedicated AI agent analyzing a different aspect of your codebase. Click any card to expand and see detailed findings.',
            side: 'left',
          },
        },
        {
          element: '#tour-graph',
          popover: {
            title: 'Repository Graph',
            description: 'Interactive visualization of your codebase architecture built from the analysis results. Nodes represent services and modules. Zoom, pan, and click to explore.',
            side: 'top',
          },
        },
        {
          element: '#tour-chat',
          popover: {
            title: 'Engineering Chat',
            description: 'Ask questions about your codebase in natural language. Powered by Cerebras for ultra-fast inference at 100+ tokens/second.',
            side: 'top',
          },
        },
      ],
    });
    d.drive();
  }, []);

  return { startTour, activeStep };
}
