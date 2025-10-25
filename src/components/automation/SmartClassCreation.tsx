import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Class, Subject, ClassConfigurationWorkflow } from '../../types';
import apiService from '../../services/apiService';

interface SmartClassCreationProps {
  onClassCreated?: (classObj: Class) => void;
  onCancel?: () => void;
  initialData?: Partial<Class> & {
    subjectIds?: string[];
  };
}

const SmartClassCreation: React.FC<SmartClassCreationProps> = ({
  onClassCreated,
  onCancel,
  initialData = {}
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced' | 'wizard'>('simple');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ClassConfigurationWorkflow | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    subjectIds: string[];
    description?: string;
    maxCapacity?: string;
    roomNumber?: string;
  }>({
    name: initialData.name || '',
    subjectIds: initialData.subjectIds || []
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const wizardSteps = [
    { title: 'Basic Information', description: 'Enter class name and basic details' },
    { title: 'Subject Selection', description: 'Choose subjects for this class' },
    { title: 'Teacher Assignment', description: 'Review and confirm teacher assignments' },
    { title: 'Review & Create', description: 'Review all information before creating' }
  ];

  useEffect(() => {
    loadSubjects();
    if (formData.name) {
      generateSuggestions();
    }
  }, [formData.name]);

  const loadSubjects = async () => {
    try {
      const allSubjects = await apiService.getAllSubjects();
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const generateSuggestions = async () => {
    try {
      const response = await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/infer-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'class',
          entityId: 'temp',
          context: {
            name: formData.name
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Convert relationship suggestions to workflow format
        const workflowData: ClassConfigurationWorkflow = {
          classData: formData,
          suggestedSubjects: data.relationships.relationships?.filter((r: any) => r.type === 'class_subject').map((r: any) => r.data?.subject),
          recommendedTeachers: data.relationships.relationships?.filter((r: any) => r.type === 'class_teacher').map((r: any) => r.data?.teacher),
          assessmentFrameworks: [],
          communicationTemplates: []
        };
        setSuggestions(workflowData);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push('Class name is required');
    }

    if (formData.subjectIds.length === 0) {
      newWarnings.push('Adding subjects will help with teacher assignments');
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const classData = {
        name: formData.name,
        subjectIds: formData.subjectIds
      };

      const result = await apiService.createClass(classData.name, classData.subjectIds);
      
      if (result.id) {
        // Execute workflow if we have suggestions
        if (suggestions) {
          await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowType: 'class_configuration',
              triggerData: {
                classData: { ...classData, id: result.id },
                preferences: {
                  autoAssignSubjects: !!suggestions.suggestedSubjects?.length,
                  autoAssignTeachers: !!suggestions.recommendedTeachers?.length
                }
              }
            })
          });
        }

        onClassCreated?.(result);
      }
    } catch (error) {
      console.error('Failed to create class:', error);
      setErrors(['Failed to create class. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    const newSubjectIds = formData.subjectIds.includes(subjectId)
      ? formData.subjectIds.filter(id => id !== subjectId)
      : [...formData.subjectIds, subjectId];
    
    setFormData({ ...formData, subjectIds: newSubjectIds });
  };

  const renderSimpleMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Grade 5 Mathematics"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subjects
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.subjectIds.includes(subject.id)}
                onChange={() => handleSubjectToggle(subject.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{subject.name}</span>
            </label>
          ))}
        </div>
      </div>

      {suggestions?.suggestedSubjects && suggestions.suggestedSubjects.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Suggested Subjects</h4>
          <p className="text-sm text-blue-700 mb-2">
            Based on class name, we recommend these subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.suggestedSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => handleSubjectToggle(subject.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.subjectIds.includes(subject.id)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions?.recommendedTeachers && suggestions.recommendedTeachers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Recommended Teachers</h4>
          <p className="text-sm text-green-700 mb-2">
            Found teachers who specialize in the selected subjects
          </p>
          <div className="space-y-2">
            {suggestions.recommendedTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between">
                <span className="text-sm text-green-700">
                  {teacher.name} - {teacher.subject}
                </span>
                <span className="text-xs text-green-600">
                  {teacher.currentWorkload || 0} classes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAdvancedMode = () => (
    <div className="space-y-4">
      {renderSimpleMode()}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          rows={3}
          placeholder="Optional description of the class"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Capacity
        </label>
        <Input
          type="number"
          value={formData.maxCapacity || ''}
          onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
          placeholder="Maximum number of students"
          min="1"
          max="50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room Number
        </label>
        <Input
          value={formData.roomNumber || ''}
          onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
          placeholder="e.g., Room 201"
          className="w-full"
        />
      </div>
    </div>
  );

  const renderWizardMode = () => {
    const renderStep = () => {
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grade 5 Mathematics"
                  className="w-full"
                />
              </div>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4">
              {suggestions?.suggestedSubjects && suggestions.suggestedSubjects.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Suggested Subjects</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Based on class name, we recommend these subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.suggestedSubjects.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSubjectToggle(subject.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.subjectIds.includes(subject.id)
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subjects
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.subjectIds.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Review Teacher Assignments</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><strong>Class:</strong> {formData.name}</div>
                <div><strong>Selected Subjects:</strong> {formData.subjectIds.length}</div>
                {suggestions?.recommendedTeachers && suggestions.recommendedTeachers.length > 0 && (
                  <div className="mt-2">
                    <strong>Available Teachers:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {suggestions.recommendedTeachers.map((teacher) => (
                        <li key={teacher.id}>
                          {teacher.name} - {teacher.subject} (0 classes)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Review Class Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Subjects:</strong> {formData.subjectIds.length} selected</div>
                {formData.description && <div><strong>Description:</strong> {formData.description}</div>}
                {formData.maxCapacity && <div><strong>Max Capacity:</strong> {formData.maxCapacity}</div>}
                {formData.roomNumber && <div><strong>Room:</strong> {formData.roomNumber}</div>}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Step {currentStep + 1} of {wizardSteps.length}
            </h3>
            <div className="flex space-x-2">
              {wizardSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">
            {wizardSteps[currentStep].title}
          </h4>
          <p className="text-sm text-gray-600">
            {wizardSteps[currentStep].description}
          </p>
        </div>
        
        {renderStep()}
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          {currentStep < wizardSteps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!formData.name.trim()}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              Create Class
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Class
          </h2>
          <div className="flex space-x-2">
            <Button
              variant={mode === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('simple')}
            >
              Simple
            </Button>
            <Button
              variant={mode === 'advanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('advanced')}
            >
              Advanced
            </Button>
            <Button
              variant={mode === 'wizard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('wizard')}
            >
              Wizard
            </Button>
          </div>
        </div>

        {errors.length > 0 && (
          <Alert variant="error" className="mb-4">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert variant="warning" className="mb-4">
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'simple' && renderSimpleMode()}
          {mode === 'advanced' && renderAdvancedMode()}
          {mode === 'wizard' && renderWizardMode()}

          {mode !== 'wizard' && (
            <div className="flex justify-end space-x-3 mt-6">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading && <LoadingSpinner size="sm" />}
                Create Class
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default SmartClassCreation;