import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTutorial } from '../../contexts/TutorialContext';
import Modal from '../ui/Modal';

interface TutorialAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialAlertModal: React.FC<TutorialAlertModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { startTutorial, dontShowAgain, setDontShowAgain } = useTutorial();
  const isRtl = ['ar', 'ku-sorani', 'ku-badini', 'syr'].includes(i18n.language);

  const handleStartTutorial = () => {
    startTutorial('adminDashboard');
    onClose();
  };

  const handleStartDigitizationTutorial = () => {
    startTutorial('schoolDigitization');
    onClose();
  };

  const handleDontShowAgainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(e.target.checked);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title={t('welcome_to_admin_dashboard')}>
      <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Welcome Message */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {t('welcome_to_admin_dashboard')}
          </h3>
          <p className="text-gray-600">
            {t('tutorial_description')}
          </p>
        </div>

        {/* Tutorial Benefits */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">
            {t('what_you_will_learn')}
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('navigate_dashboard_efficiently')}
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('manage_users_effectively')}
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('understand_system_relationships')}
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('utilize_analytics_reports')}
            </li>
          </ul>
        </div>

        {/* Duration Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t('tutorial_duration')}
          </p>
        </div>

        {/* Don't Show Again Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="dont-show-again"
            checked={dontShowAgain}
            onChange={handleDontShowAgainChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-describedby="dont-show-again-desc"
          />
          <label htmlFor="dont-show-again" className="ml-2 text-sm text-gray-600" id="dont-show-again-desc">
            {t('dont_show_again')}
          </label>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('skip_tutorial')}
            >
              {t('skip_tutorial')}
            </button>
            <button
              onClick={handleStartTutorial}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('start_tutorial')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('start_tutorial')}
            </button>
          </div>
          
          <button
            onClick={handleStartDigitizationTutorial}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={t('start_digitization_tutorial')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('start_digitization_tutorial')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TutorialAlertModal;