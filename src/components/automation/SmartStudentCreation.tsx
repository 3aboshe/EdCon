import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { User, Class, Subject, AutomationSuggestion, StudentCreationWorkflow } from '../../types';
import apiService from '../../services/apiService';

interface SmartStudentCreationProps {
  onStudentCreated?: (student: User) => void;
  onCancel?: () => void;
  initialData?: Partial<User> & {
    age?: string;
    grade?: string;
    parentId?: string;
    classId?: string;
  };
}

const SmartStudentCreation: React.FC<SmartStudentCreationProps> = ({
  onStudentCreated,
  onCancel,
  initialData = {}
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced' | 'wizard'>('simple');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<StudentCreationWorkflow | null>(null);
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    age: initialData.age || '',
    grade: initialData.grade || '',
    avatar: initialData.avatar || '',
    parentId: initialData.parentId || '',
    classId: initialData.classId || ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const wizardSteps = [
    { title: 'Basic Information', description: 'Enter student name and basic details' },
    { title: 'Class Selection', description: 'Choose or confirm class assignment' },
    { title: 'Parent Assignment', description: 'Link to parent/guardian' },
    { title: 'Review & Create', description: 'Review all information before creating' }
  ];

  useEffect(() => {
    if (formData.name || formData.age || formData.grade) {
      generateSuggestions();
    }
  }, [formData.name, formData.age, formData.grade]);

  const generateSuggestions = async () => {
    try {
      const response = await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/infer-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'student',
          entityId: 'temp',
          context: {
            name: formData.name,
            age: formData.age,
            grade: formData.grade
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Convert relationship suggestions to workflow format
        const workflowData: StudentCreationWorkflow = {
          studentData: {
            ...formData,
            grade: formData.grade ? Number(formData.grade) : undefined
          },
          suggestedClass: data.relationships.relationships?.find((r: any) => r.type === 'student_class')?.data?.class,
          potentialParents: data.relationships.relationships?.filter((r: any) => r.type === 'parent_child').map((r: any) => r.data?.parent),
          recommendedSubjects: data.relationships.relationships?.filter((r: any) => r.type === 'student_subject').map((r: any) => r.data?.subject)
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
      newErrors.push('Student name is required');
    }

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 4 || Number(formData.age) > 18)) {
      newErrors.push('Age must be between 4 and 18');
    }

    if (formData.grade && (isNaN(Number(formData.grade)) || Number(formData.grade) < 1 || Number(formData.grade) > 12)) {
      newErrors.push('Grade must be between 1 and 12');
    }

    if (!formData.age && !formData.grade) {
      newWarnings.push('Providing age or grade will help with class suggestions');
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
      const studentData = {
        name: formData.name,
        role: 'student',
        age: formData.age,
        grade: formData.grade,
        avatar: formData.avatar,
        parentId: formData.parentId,
        classId: formData.classId || suggestions?.suggestedClass?.id
      };

      const result = await apiService.createUser(studentData);
      
      if (result.code) {
        // Execute workflow if we have suggestions
        if (suggestions) {
          await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowType: 'student_creation',
              triggerData: {
                studentData: { ...studentData, id: result.code },
                preferences: {
                  autoAssignClass: !!suggestions.suggestedClass,
                  autoAssignParent: !!formData.parentId
                }
              }
            })
          });
        }

        onStudentCreated?.(result.user);
      }
    } catch (error) {
      console.error('Failed to create student:', error);
      setErrors(['Failed to create student. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Student Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter student name"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <Input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="Age (4-18)"
            min="4"
            max="18"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade
          </label>
          <Input
            type="number"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            placeholder="Grade (1-12)"
            min="1"
            max="12"
          />
        </div>
      </div>

      {suggestions?.suggestedClass && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Suggested Class</h4>
          <p className="text-sm text-blue-700 mb-2">
            {suggestions.suggestedClass.name} - 0 students
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormData({ ...formData, classId: suggestions.suggestedClass?.id })}
          >
            Use Suggestion
          </Button>
        </div>
      )}

      {suggestions?.potentialParents && suggestions.potentialParents.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Potential Parents Found</h4>
          <div className="space-y-2">
            {suggestions.potentialParents.map((parent) => (
              <div key={parent.id} className="flex items-center justify-between">
                <span className="text-sm text-green-700">{parent.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, parentId: parent.id })}
                >
                  Select
                </Button>
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
          Parent ID
        </label>
        <Input
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          placeholder="Enter parent ID (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class ID
        </label>
        <Input
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          placeholder="Enter class ID (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Avatar URL
        </label>
        <Input
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          placeholder="Enter avatar URL (optional)"
        />
      </div>

      {suggestions?.recommendedSubjects && suggestions.recommendedSubjects.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">Recommended Subjects</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.recommendedSubjects.map((subject) => (
              <span
                key={subject.id}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {subject.name}
              </span>
            ))}
          </div>
        </div>
      )}
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
                  Student Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter student name"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age (4-18)"
                    min="4"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <Input
                    type="number"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Grade (1-12)"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4">
              {suggestions?.suggestedClass ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Suggested Class</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    {suggestions.suggestedClass.name} - 0 students
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFormData({ ...formData, classId: suggestions.suggestedClass?.id })}
                  >
                    Use Suggestion
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class ID
                  </label>
                  <Input
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    placeholder="Enter class ID"
                  />
                </div>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              {suggestions?.potentialParents && suggestions.potentialParents.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Potential Parents Found</h4>
                  <div className="space-y-2">
                    {suggestions.potentialParents.map((parent) => (
                      <div key={parent.id} className="flex items-center justify-between">
                        <span className="text-sm text-green-700">{parent.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, parentId: parent.id })}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent ID
                  </label>
                  <Input
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    placeholder="Enter parent ID"
                  />
                </div>
              )}
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Review Student Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><strong>Name:</strong> {formData.name}</div>
                {formData.age && <div><strong>Age:</strong> {formData.age}</div>}
                {formData.grade && <div><strong>Grade:</strong> {formData.grade}</div>}
                {formData.classId && <div><strong>Class:</strong> {formData.classId}</div>}
                {formData.parentId && <div><strong>Parent:</strong> {formData.parentId}</div>}
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
              Create Student
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
            Create New Student
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
                {loading ? <LoadingSpinner size="sm" /> : null}
                Create Student
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default SmartStudentCreation;