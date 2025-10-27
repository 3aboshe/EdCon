import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
  requireInteraction?: boolean; // Whether user must interact before proceeding
}

export interface TutorialConfig {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialContextType {
  isActive: boolean;
  currentTutorial: TutorialConfig | null;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  startTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
  progress: number;
  totalSteps: number;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Tutorial configurations
const TUTORIALS: Record<string, TutorialConfig> = {
  adminDashboard: {
    id: 'adminDashboard',
    name: 'Admin Dashboard Tutorial',
    description: 'Learn how to navigate and use admin dashboard effectively',
   steps: [
     {
       id: 'welcome',
       title: 'Welcome to EdCon Admin Dashboard',
       content: 'This tutorial will guide you through admin dashboard and show you how to manage your educational institution efficiently. Let\'s start with the main navigation.',
       position: 'center',
       requireInteraction: true
     },
      {
        id: 'sidebar',
        title: 'Navigation Sidebar',
        content: 'This is your main navigation menu. You can access different sections like Dashboard, Analytics, User Management, Academic settings, System settings, and Reports.',
        target: '.lg\\:w-64',
        position: 'right'
      },
      {
        id: 'dashboard',
        title: 'Dashboard Overview',
        content: 'The dashboard gives you a quick overview of your institution with key metrics, statistics, and recent activities.',
        target: '[data-section="dashboard"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="dashboard"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'analytics',
        title: 'Analytics Section',
        content: 'View detailed analytics including grade distributions, attendance trends, and performance metrics to make data-driven decisions.',
        target: '[data-section="analytics"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="analytics"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'users',
        title: 'User Management',
        content: 'Manage all users in your system - students, teachers, and parents. You can add, edit, or delete users from here.',
        target: '[data-section="users"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="users"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'students-tab',
        title: 'Managing Students',
        content: 'In the Students tab, you can add new students, assign them to classes, link them with parents, and manage their information.',
        target: '[data-tab="students"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-tab="students"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'teachers-tab',
        title: 'Managing Teachers',
        content: 'Add teachers, assign them subjects, and automatically link them to classes that teach those subjects.',
        target: '[data-tab="teachers"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-tab="teachers"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'parents-tab',
        title: 'Managing Parents',
        content: 'Create parent accounts and link them to their children for seamless communication and monitoring.',
        target: '[data-tab="parents"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-tab="parents"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'academic',
        title: 'Academic Management',
        content: 'Manage classes and subjects. Create classes, assign subjects to them, and organize your academic structure.',
        target: '[data-section="academic"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="academic"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'classes-management',
        title: 'Class Management',
        content: 'Create and manage classes. Each class can have multiple subjects assigned to it.',
        target: '[data-tab="classes"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-tab="classes"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'subjects-management',
        title: 'Subject Management',
        content: 'Create and manage subjects that will be taught in your classes.',
        target: '[data-tab="subjects"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-tab="subjects"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'system',
        title: 'System Settings',
        content: 'Access system-wide settings including data backup, system information, and administrative tools.',
        target: '[data-section="system"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="system"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'reports',
        title: 'Reports',
        content: 'Generate comprehensive reports about user activity, system usage, and communication summaries.',
        target: '[data-section="reports"]',
        position: 'bottom',
        action: () => {
          const tab = document.querySelector('[data-section="reports"]') as HTMLButtonElement;
          tab?.click();
        }
      },
      {
        id: 'relationships',
        title: 'Understanding Relationships',
        content: 'EdCon automatically manages relationships between entities. When you assign a subject to a class, teachers teaching that subject are automatically linked. When you create a student, they get enrolled in all subjects of their class.',
        position: 'center',
        requireInteraction: true
      },
      {
        id: 'completion',
        title: 'Tutorial Complete!',
        content: 'You\'ve completed the admin dashboard tutorial! You now have a good understanding of how to manage your educational institution using EdCon. Remember, you can always restart this tutorial from the help menu.',
        position: 'center',
        requireInteraction: true
      }
   ]
},
schoolDigitization: {
  id: 'schoolDigitization',
  name: 'School Digitization Tutorial',
  description: 'Learn how to digitize your school step by step',
  steps: [
    {
      id: 'digitization-welcome',
      title: 'Welcome to School Digitization Tutorial',
      content: 'This tutorial will guide you through the process of digitizing your school. We\'ll start by adding subjects, then assigning them to classes, adding teachers, and finally parents and students.',
      position: 'center',
      requireInteraction: true
    },
    {
      id: 'add-subjects',
      title: 'Step 1: Add Subjects',
      content: 'First, let\'s add all the subjects taught in your school. Go to Academic Management → Subjects and click "Add Subject" to create subjects like Mathematics, Science, English, etc.',
      target: '[data-section="academic"]',
      position: 'bottom',
      action: () => {
        const tab = document.querySelector('[data-section="academic"]') as HTMLButtonElement;
        tab?.click();
        setTimeout(() => {
          const subjectsTab = document.querySelector('[data-tab="subjects"]') as HTMLButtonElement;
          subjectsTab?.click();
        }, 300);
      }
    },
    {
      id: 'create-classes',
      title: 'Step 2: Create Classes',
      content: 'Now let\'s create classes for each grade level. Go to Academic Management → Classes and create classes like Grade 1, Grade 2, etc.',
      target: '[data-tab="classes"]',
      position: 'bottom',
      action: () => {
        const tab = document.querySelector('[data-tab="classes"]') as HTMLButtonElement;
        tab?.click();
      }
    },
    {
      id: 'assign-subjects-to-classes',
      title: 'Step 3: Assign Subjects to Classes',
      content: 'For each class, assign the subjects they will study. Click on a class and select the subjects from the list. This creates the foundation for automatic teacher-student relationships.',
      target: '[data-tab="classes"]',
      position: 'bottom',
      requireInteraction: true
    },
    {
      id: 'add-teachers',
      title: 'Step 4: Add Teachers',
      content: 'Now let\'s add teachers who will teach these subjects. Go to User Management → Teachers and add teacher accounts with their specializations.',
      target: '[data-section="users"]',
      position: 'bottom',
      action: () => {
        const tab = document.querySelector('[data-section="users"]') as HTMLButtonElement;
        tab?.click();
        setTimeout(() => {
          const teachersTab = document.querySelector('[data-tab="teachers"]') as HTMLButtonElement;
          teachersTab?.click();
        }, 300);
      }
    },
    {
      id: 'assign-subjects-to-teachers',
      title: 'Step 5: Assign Subjects to Teachers',
      content: 'For each teacher, assign the subjects they are qualified to teach. EdCon will automatically link them to classes that have these subjects.',
      target: '[data-tab="teachers"]',
      position: 'bottom',
      requireInteraction: true
    },
    {
      id: 'add-parents',
      title: 'Step 6: Add Parents',
      content: 'Next, let\'s add parent accounts. Go to User Management → Parents and create accounts for parents. You can link them to children later.',
      target: '[data-tab="parents"]',
      position: 'bottom',
      action: () => {
        const tab = document.querySelector('[data-tab="parents"]') as HTMLButtonElement;
        tab?.click();
      }
    },
    {
      id: 'add-students',
      title: 'Step 7: Add Students',
      content: 'Finally, let\'s add students. Go to User Management → Students and create student accounts. Assign them to classes and link them to parents.',
      target: '[data-tab="students"]',
      position: 'bottom',
      action: () => {
        const tab = document.querySelector('[data-tab="students"]') as HTMLButtonElement;
        tab?.click();
      }
    },
    {
      id: 'automatic-relationships',
      title: 'Automatic Relationships',
      content: 'EdCon automatically creates relationships: Teachers are linked to classes teaching their subjects, Students are enrolled in all subjects of their class, and Parents can monitor their children\'s progress.',
      position: 'center',
      requireInteraction: true
    },
    {
      id: 'digitization-complete',
      title: 'School Digitization Complete!',
      content: 'Congratulations! You\'ve successfully digitized your school. Your educational institution is now ready for efficient management with automatic relationships and streamlined workflows.',
      position: 'center',
      requireInteraction: true
    }
  ]
}
};

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<TutorialConfig | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(() => {
    const saved = localStorage.getItem('tutorial-dont-show-again');
    return saved === 'true';
  });

  const currentStep = currentTutorial ? currentTutorial.steps[currentStepIndex] : null;
  const progress = currentStepIndex + 1;
  const totalSteps = currentTutorial?.steps.length || 0;

  // Load saved tutorial state
  useEffect(() => {
    const savedState = localStorage.getItem('tutorial-state');
    if (savedState) {
      try {
        const { tutorialId, stepIndex } = JSON.parse(savedState);
        if (tutorialId && TUTORIALS[tutorialId]) {
          setCurrentTutorial(TUTORIALS[tutorialId]);
          setCurrentStepIndex(stepIndex);
          setIsActive(true);
        }
      } catch (error) {
        console.error('Failed to load tutorial state:', error);
      }
    }
  }, []);

  // Save tutorial state
  useEffect(() => {
    if (isActive && currentTutorial) {
      const state = {
        tutorialId: currentTutorial.id,
        stepIndex: currentStepIndex
      };
      localStorage.setItem('tutorial-state', JSON.stringify(state));
    } else {
      localStorage.removeItem('tutorial-state');
    }
  }, [isActive, currentTutorial, currentStepIndex]);

  // Save don't show again preference
  useEffect(() => {
    localStorage.setItem('tutorial-dont-show-again', dontShowAgain.toString());
  }, [dontShowAgain]);

  const startTutorial = (tutorialId: string) => {
    const tutorial = TUTORIALS[tutorialId];
    if (tutorial) {
      setCurrentTutorial(tutorial);
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  };

  const nextStep = () => {
    if (currentTutorial && currentStepIndex < currentTutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStepIndex(0);
  };

  const completeTutorial = () => {
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStepIndex(0);
  };

  const pauseTutorial = () => {
    setIsActive(false);
  };

  const resumeTutorial = () => {
    if (currentTutorial) {
      setIsActive(true);
    }
  };

  const value: TutorialContextType = {
    isActive,
    currentTutorial,
    currentStepIndex,
    currentStep,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    pauseTutorial,
    resumeTutorial,
    dontShowAgain,
    setDontShowAgain,
    progress,
    totalSteps
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};