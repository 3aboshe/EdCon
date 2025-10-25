import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { User, Class, Subject, TeacherAssignmentWorkflow } from '../../types';
import apiService from '../../services/apiService';

interface SmartTeacherCreationProps {
  onTeacherCreated?: (teacher: User) => void;
  onCancel?: () => void;
  initialData?: Partial<User> & {
    subject?: string;
    email?: string;
    classIds?: string[];
  };
}

const SmartTeacherCreation: React.FC<SmartTeacherCreationProps> = ({
  onTeacherCreated,
  onCancel,
  initialData = {}
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced' | 'wizard'>('simple');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TeacherAssignmentWorkflow | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    subject: string;
    email: string;
    avatar: string;
    classIds: string[];
    messagingAvailability?: {
      startTime: string;
      endTime: string;
    };
  }>({
    name: initialData.name || '',
    subject: initialData.subject || '',
    email: initialData.email || '',
    avatar: initialData.avatar || '',
    classIds: initialData.classIds || []
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const wizardSteps = [
    { title: 'Basic Information', description: 'Enter teacher name and specialization' },
    { title: 'Subject Assignment', description: 'Choose teaching subjects' },
    { title: 'Class Assignment', description: 'Review and confirm class assignments' },
    { title: 'Review & Create', description: 'Review all information before creating' }
  ];

  useEffect(() => {
    if (formData.name || formData.subject) {
      generateSuggestions();
    }
  }, [formData.name, formData.subject]);

  const generateSuggestions = async () => {
    try {
      const response = await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/infer-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'teacher',
          entityId: 'temp',
          context: {
            name: formData.name,
            subject: formData.subject
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Convert relationship suggestions to workflow format
        const workflowData: TeacherAssignmentWorkflow = {
          teacherData: formData,
          relevantClasses: data.relationships.relationships?.filter((r: any) => r.type === 'teacher_class').map((r: any) => r.data?.class),
          workloadBalance: data.relationships.relationships?.find((r: any) => r.type === 'teacher_subject')?.data,
          scheduleConflicts: []
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
      newErrors.push('Teacher name is required');
    }

    if (!formData.subject.trim()) {
      newErrors.push('Subject specialization is required');
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.push('Please enter a valid email address');
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
      const teacherData = {
        name: formData.name,
        role: 'teacher',
        subject: formData.subject,
        email: formData.email,
        avatar: formData.avatar,
        classIds: suggestions?.relevantClasses?.map((c: any) => c.id) || formData.classIds
      };

      const result = await apiService.createUser(teacherData);
      
      if (result.code) {
        // Execute workflow if we have suggestions
        if (suggestions) {
          await fetch(`${'https://edcon-production.up.railway.app'}/api/workflows/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowType: 'teacher_assignment',
              triggerData: {
                teacherData: { ...teacherData, id: result.code },
                preferences: {
                  autoAssignClasses: !!suggestions.relevantClasses?.length
                }
              }
            })
          });
        }

        onTeacherCreated?.(result.user);
      }
    } catch (error) {
      console.error('Failed to create teacher:', error);
      setErrors(['Failed to create teacher. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teacher Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter teacher name"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject Specialization *
        </label>
        <Input
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g., Mathematics, English, Science"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="teacher@school.edu"
          className="w-full"
        />
      </div>

      {suggestions?.relevantClasses && suggestions.relevantClasses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Suggested Classes</h4>
          <p className="text-sm text-blue-700 mb-2">
            Found {suggestions.relevantClasses.length} classes that need {formData.subject} teachers
          </p>
          <div className="space-y-2">
            {suggestions.relevantClasses.map((classObj: any) => (
              <div key={classObj.id} className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {classObj.name} - {classObj.currentStudents || 0} students
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ 
                    ...formData, 
                    classIds: [...(formData.classIds || []), classObj.id] 
                  })}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions?.workloadBalance && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Workload Analysis</h4>
          <p className="text-sm text-green-700">
            Average workload: {suggestions.workloadBalance.averageWorkload?.toFixed(1) || 0} classes per teacher
          </p>
          <p className="text-sm text-green-700">
            Can assign more classes: {suggestions.workloadBalance.canAssignMore ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  );

  const renderAdvancedMode = () => (
    <div className="space-y-4">
      {renderSimpleMode()}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Avatar URL
        </label>
        <Input
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          placeholder="Enter avatar URL (optional)"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pre-assigned Classes
        </label>
        <Input
          value={formData.classIds?.join(', ')}
          onChange={(e) => setFormData({ 
            ...formData, 
            classIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean) 
          })}
          placeholder="Enter class IDs separated by commas"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Messaging Availability
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Start time (e.g., 09:00)"
            onChange={(e) => setFormData({
              ...formData,
              messagingAvailability: {
                ...formData.messagingAvailability,
                startTime: e.target.value
              }
            })}
          />
          <Input
            type="text"
            placeholder="End time (e.g., 17:00)"
            onChange={(e) => setFormData({
              ...formData,
              messagingAvailability: {
                ...formData.messagingAvailability,
                endTime: e.target.value
              }
            })}
          />
        </div>
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
                  Teacher Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter teacher name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Specialization *
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics, English, Science"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@school.edu"
                  className="w-full"
                />
              </div>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4">
              {suggestions?.relevantClasses && suggestions.relevantClasses.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Suggested Classes</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Found {suggestions.relevantClasses.length} classes that need {formData.subject} teachers
                  </p>
                  <div className="space-y-2">
                    {suggestions.relevantClasses.map((classObj: any) => (
                      <div key={classObj.id} className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          {classObj.name} - {classObj.currentStudents || 0} students
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ 
                            ...formData, 
                            classIds: [...(formData.classIds || []), classObj.id] 
                          })}
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class IDs
                  </label>
                  <Input
                    value={formData.classIds?.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      classIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean) 
                    })}
                    placeholder="Enter class IDs separated by commas"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Review Class Assignments</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><strong>Teacher:</strong> {formData.name}</div>
                <div><strong>Subject:</strong> {formData.subject}</div>
                <div><strong>Assigned Classes:</strong> {formData.classIds?.length || 0}</div>
                {formData.classIds && formData.classIds.length > 0 && (
                  <div className="mt-2">
                    <strong>Class List:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {formData.classIds.map((classId, index) => (
                        <li key={index}>{classId}</li>
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
              <h4 className="font-medium text-gray-900">Review Teacher Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Subject:</strong> {formData.subject}</div>
                {formData.email && <div><strong>Email:</strong> {formData.email}</div>}
                {formData.classIds && <div><strong>Classes:</strong> {formData.classIds.length}</div>}
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
              disabled={!formData.name.trim() || !formData.subject.trim()}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              Create Teacher
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
            Create New Teacher
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
                Create Teacher
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default SmartTeacherCreation;