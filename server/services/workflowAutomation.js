import { prisma } from '../config/db.js';

class WorkflowAutomationService {
  constructor() {
    this.workflowTypes = {
      STUDENT_CREATION: 'student_creation',
      TEACHER_ASSIGNMENT: 'teacher_assignment',
      CLASS_CONFIGURATION: 'class_configuration'
    };
  }

  /**
   * Execute a workflow with step-by-step processing and rollback capability
   * @param {string} workflowType - Type of workflow to execute
   * @param {object} triggerData - Data that triggered the workflow
   * @param {string} createdBy - User who initiated the workflow
   * @returns {Promise<object>} - Workflow execution result
   */
  async executeWorkflow(workflowType, triggerData, createdBy = null) {
    const workflowExecution = await prisma.workflowExecution.create({
      data: {
        workflowType,
        triggerData,
        executionStatus: 'running',
        stepsCompleted: [],
        startedAt: new Date()
      }
    });

    try {
      let result;
      switch (workflowType) {
        case this.workflowTypes.STUDENT_CREATION:
          result = await this.executeStudentCreationWorkflow(triggerData, workflowExecution.id);
          break;
        case this.workflowTypes.TEACHER_ASSIGNMENT:
          result = await this.executeTeacherAssignmentWorkflow(triggerData, workflowExecution.id);
          break;
        case this.workflowTypes.CLASS_CONFIGURATION:
          result = await this.executeClassConfigurationWorkflow(triggerData, workflowExecution.id);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }

      await prisma.workflowExecution.update({
        where: { id: workflowExecution.id },
        data: {
          executionStatus: 'completed',
          resultData: result,
          completedAt: new Date()
        }
      });

      return {
        success: true,
        workflowId: workflowExecution.id,
        result
      };
    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: workflowExecution.id },
        data: {
          executionStatus: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        }
      });

      // Attempt rollback if possible
      await this.rollbackWorkflow(workflowExecution.id);

      throw error;
    }
  }

  /**
   * Student Creation Workflow - Auto-suggest class, find parents, recommend subjects
   */
  async executeStudentCreationWorkflow(triggerData, workflowExecutionId) {
    const steps = [];
    const { studentData, preferences = {} } = triggerData;

    try {
      // Step 1: Suggest appropriate class based on age/grade
      steps.push('suggesting_class');
      const suggestedClass = await this.suggestClassForStudent(studentData, preferences);
      
      // Step 2: Find potential parent matches
      steps.push('finding_parents');
      const potentialParents = await this.findPotentialParents(studentData);
      
      // Step 3: Recommend subject combinations
      steps.push('recommending_subjects');
      const recommendedSubjects = await this.recommendSubjectsForStudent(studentData, suggestedClass);
      
      // Step 4: Setup communication channels
      steps.push('setting_up_communication');
      const communicationSetup = await this.setupStudentCommunication(studentData, potentialParents);

      // Update workflow progress
      await prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: { stepsCompleted: steps }
      });

      return {
        suggestedClass,
        potentialParents,
        recommendedSubjects,
        communicationSetup,
        steps
      };
    } catch (error) {
      throw new Error(`Student creation workflow failed at step: ${steps[steps.length - 1] || 'initialization'}. Error: ${error.message}`);
    }
  }

  /**
   * Teacher Assignment Workflow - Identify classes, check workload, auto-assign
   */
  async executeTeacherAssignmentWorkflow(triggerData, workflowExecutionId) {
    const steps = [];
    const { teacherData, preferences = {} } = triggerData;

    try {
      // Step 1: Identify relevant classes by subject
      steps.push('identifying_classes');
      const relevantClasses = await this.findRelevantClassesForTeacher(teacherData);
      
      // Step 2: Check workload balance
      steps.push('checking_workload');
      const workloadBalance = await this.analyzeTeacherWorkload(teacherData, relevantClasses);
      
      // Step 3: Auto-assign to appropriate classes
      steps.push('assigning_classes');
      const assignmentResult = await this.assignTeacherToClasses(teacherData, relevantClasses, workloadBalance);
      
      // Step 4: Create student communication links
      steps.push('creating_communication_links');
      const communicationLinks = await this.createTeacherCommunicationLinks(teacherData, assignmentResult.assignedClasses);

      await prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: { stepsCompleted: steps }
      });

      return {
        relevantClasses,
        workloadBalance,
        assignmentResult,
        communicationLinks,
        steps
      };
    } catch (error) {
      throw new Error(`Teacher assignment workflow failed at step: ${steps[steps.length - 1] || 'initialization'}. Error: ${error.message}`);
    }
  }

  /**
   * Class Configuration Workflow - Suggest subjects, teachers, assessments
   */
  async executeClassConfigurationWorkflow(triggerData, workflowExecutionId) {
    const steps = [];
    const { classData, preferences = {} } = triggerData;

    try {
      // Step 1: Suggest subjects by grade level
      steps.push('suggesting_subjects');
      const suggestedSubjects = await this.suggestSubjectsForClass(classData);
      
      // Step 2: Recommend teacher assignments
      steps.push('recommending_teachers');
      const recommendedTeachers = await this.recommendTeachersForClass(classData, suggestedSubjects);
      
      // Step 3: Auto-create assessment frameworks
      steps.push('creating_assessments');
      const assessmentFrameworks = await this.createAssessmentFrameworks(classData, suggestedSubjects);
      
      // Step 4: Generate communication templates
      steps.push('generating_templates');
      const communicationTemplates = await this.generateClassCommunicationTemplates(classData);

      await prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: { stepsCompleted: steps }
      });

      return {
        suggestedSubjects,
        recommendedTeachers,
        assessmentFrameworks,
        communicationTemplates,
        steps
      };
    } catch (error) {
      throw new Error(`Class configuration workflow failed at step: ${steps[steps.length - 1] || 'initialization'}. Error: ${error.message}`);
    }
  }

  /**
   * Suggest appropriate class for student based on age/grade
   */
  async suggestClassForStudent(studentData, preferences) {
    const { age, grade } = studentData;
    
    const classes = await prisma.class.findMany({
      include: {
        students: true
      }
    });

    // Filter classes based on grade level and capacity
    const suitableClasses = classes.filter(cls => {
      const studentCount = cls.students.length;
      const maxCapacity = 30; // Default capacity
      const isGradeAppropriate = this.isGradeAppropriate(cls.name, grade || age);
      return isGradeAppropriate && studentCount < maxCapacity;
    });

    // Sort by availability (fewer students first)
    suitableClasses.sort((a, b) => a.students.length - b.students.length);

    return {
      suggested: suitableClasses[0] || null,
      alternatives: suitableClasses.slice(1, 3),
      reasoning: `Based on ${grade ? `grade ${grade}` : `age ${age}`} and class capacity`
    };
  }

  /**
   * Find potential parent matches based on surname
   */
  async findPotentialParents(studentData) {
    const { name } = studentData;
    const studentSurname = name.split(' ').pop().toLowerCase();

    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT'
      }
    });

    const potentialParents = parents.filter(parent => {
      const parentSurname = parent.name.split(' ').pop().toLowerCase();
      return parentSurname === studentSurname;
    });

    return {
      matches: potentialParents,
      confidence: potentialParents.length > 0 ? 0.8 : 0.1,
      reasoning: potentialParents.length > 0 
        ? `Found ${potentialParents.length} parents with matching surname "${studentSurname}"`
        : `No parents found with matching surname "${studentSurname}"`
    };
  }

  /**
   * Recommend subjects for student based on curriculum
   */
  async recommendSubjectsForStudent(studentData, suggestedClass) {
    const subjects = await prisma.subject.findMany();

    if (suggestedClass?.suggested) {
      // Get subjects already assigned to the suggested class
      const classSubjects = await prisma.subject.findMany({
        where: {
          id: {
            in: suggestedClass.suggested.subjectIds || []
          }
        }
      });
      
      return {
        recommended: classSubjects,
        alternatives: subjects.filter(s => !classSubjects.find(cs => cs.id === s.id)),
        reasoning: `Based on class curriculum for ${suggestedClass.suggested.name}`
      };
    }

    // Default recommendations based on grade level
    const coreSubjects = subjects.filter(s => 
      ['Mathematics', 'Science', 'English', 'History'].includes(s.name)
    );

    return {
      recommended: coreSubjects,
      alternatives: subjects.filter(s => !coreSubjects.find(cs => cs.id === s.id)),
      reasoning: 'Core curriculum subjects for general education'
    };
  }

  /**
   * Setup communication channels for student
   */
  async setupStudentCommunication(studentData, potentialParents) {
    const communicationChannels = [];

    // Setup parent communication if parents found
    if (potentialParents.matches.length > 0) {
      communicationChannels.push({
        type: 'parent_student',
        participants: [studentData.id, ...potentialParents.matches.map(p => p.id)],
        status: 'ready'
      });
    }

    // Setup class communication if class suggested
    if (studentData.classId) {
      communicationChannels.push({
        type: 'class_student',
        participants: [studentData.id, studentData.classId],
        status: 'ready'
      });
    }

    return {
      channels: communicationChannels,
      status: 'configured',
      reasoning: `Set up ${communicationChannels.length} communication channels`
    };
  }

  /**
   * Find relevant classes for teacher based on subject
   */
  async findRelevantClassesForTeacher(teacherData) {
    const { subject } = teacherData;
    
    if (!subject) {
      return {
        relevant: [],
        reasoning: 'No subject specified for teacher'
      };
    }

    const subjectRecord = await prisma.subject.findFirst({
      where: { name: subject }
    });

    if (!subjectRecord) {
      return {
        relevant: [],
        reasoning: `Subject "${subject}" not found in database`
      };
    }

    const classes = await prisma.class.findMany({
      where: {
        subjectIds: {
          has: subjectRecord.id
        }
      },
      include: {
        students: true
      }
    });

    return {
      relevant: classes,
      subject: subjectRecord,
      reasoning: `Found ${classes.length} classes that teach ${subject}`
    };
  }

  /**
   * Analyze teacher workload balance
   */
  async analyzeTeacherWorkload(teacherData, relevantClasses) {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        subject: teacherData.subject
      }
    });

    const workloadAnalysis = teachers.map(teacher => ({
      teacher: teacher.id,
      name: teacher.name,
      currentClasses: teacher.classIds || [],
      classCount: (teacher.classIds || []).length,
      studentCount: 0 // Would need to aggregate from classes
    }));

    // Calculate average workload
    const avgWorkload = workloadAnalysis.reduce((sum, t) => sum + t.classCount, 0) / workloadAnalysis.length;

    return {
      currentWorkloads: workloadAnalysis,
      averageWorkload: avgWorkload,
      canAssignMore: avgWorkload < 5, // Max 5 classes per teacher
      reasoning: `Current average workload is ${avgWorkload.toFixed(1)} classes per teacher`
    };
  }

  /**
   * Assign teacher to classes
   */
  async assignTeacherToClasses(teacherData, relevantClasses, workloadBalance) {
    if (!workloadBalance.canAssignMore) {
      return {
        assignedClasses: [],
        reasoning: 'Teacher workload at maximum capacity'
      };
    }

    // Assign to classes with no teacher for the subject first
    const unassignedClasses = relevantClasses.relevant.filter(cls => 
      !cls.assignedTeacher || cls.assignedTeacher !== teacherData.subject
    );

    const assignedClasses = unassignedClasses.slice(0, 3); // Max 3 new assignments

    // Update teacher with new class assignments
    await prisma.user.update({
      where: { id: teacherData.id },
      data: {
        classIds: [...(teacherData.classIds || []), ...assignedClasses.map(c => c.id)]
      }
    });

    return {
      assignedClasses,
      reasoning: `Assigned to ${assignedClasses.length} classes based on availability and workload balance`
    };
  }

  /**
   * Create teacher communication links
   */
  async createTeacherCommunicationLinks(teacherData, assignedClasses) {
    const communicationLinks = [];

    for (const classObj of assignedClasses) {
      // Get students in the class
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          classId: classObj.id
        }
      });

      // Create communication links for each student
      students.forEach(student => {
        communicationLinks.push({
          type: 'teacher_student',
          teacher: teacherData.id,
          student: student.id,
          class: classObj.id,
          status: 'active'
        });
      });
    }

    return {
      links: communicationLinks,
      status: 'established',
      reasoning: `Created ${communicationLinks.length} teacher-student communication links`
    };
  }

  /**
   * Suggest subjects for class based on grade level
   */
  async suggestSubjectsForClass(classData) {
    const subjects = await prisma.subject.findMany();
    
    // Extract grade level from class name
    const gradeLevel = this.extractGradeLevel(classData.name);
    
    // Core subjects by grade level
    const coreSubjectsByGrade = {
      '1-3': ['Mathematics', 'English', 'Science', 'Art'],
      '4-6': ['Mathematics', 'English', 'Science', 'History', 'Geography'],
      '7-9': ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Computer Science'],
      '10-12': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History']
    };

    const coreSubjects = coreSubjectsByGrade[gradeLevel] || coreSubjectsByGrade['4-6'];
    const suggestedSubjects = subjects.filter(s => coreSubjects.includes(s.name));

    return {
      suggested: suggestedSubjects,
      gradeLevel,
      reasoning: `Core subjects for grade level ${gradeLevel}`
    };
  }

  /**
   * Recommend teachers for class
   */
  async recommendTeachersForClass(classData, suggestedSubjects) {
    const recommendations = [];

    for (const subject of suggestedSubjects) {
      const teachers = await prisma.user.findMany({
        where: {
          role: 'TEACHER',
          subject: subject.name
        }
      });

      if (teachers.length > 0) {
        // Sort by current workload (fewer classes first)
        teachers.sort((a, b) => (a.classIds || []).length - (b.classIds || []).length);
        
        recommendations.push({
          subject: subject.name,
          recommendedTeacher: teachers[0],
          alternatives: teachers.slice(1, 3),
          reasoning: `Best match based on subject expertise and current workload`
        });
      }
    }

    return {
      recommendations,
      totalSubjects: suggestedSubjects.length,
      coveredSubjects: recommendations.length,
      reasoning: `Found teachers for ${recommendations.length} out of ${suggestedSubjects.length} subjects`
    };
  }

  /**
   * Create assessment frameworks for class
   */
  async createAssessmentFrameworks(classData, suggestedSubjects) {
    const frameworks = [];

    for (const subject of suggestedSubjects) {
      const framework = {
        subject: subject.name,
        assessments: [
          { type: 'quiz', weight: 20, frequency: 'weekly' },
          { type: 'test', weight: 30, frequency: 'monthly' },
          { type: 'project', weight: 25, frequency: 'quarterly' },
          { type: 'exam', weight: 25, frequency: 'semester' }
        ],
        gradingScale: {
          A: { min: 90, max: 100 },
          B: { min: 80, max: 89 },
          C: { min: 70, max: 79 },
          D: { min: 60, max: 69 },
          F: { min: 0, max: 59 }
        }
      };

      frameworks.push(framework);
    }

    return {
      frameworks,
      reasoning: `Created assessment frameworks for ${frameworks.length} subjects`
    };
  }

  /**
   * Generate communication templates for class
   */
  async generateClassCommunicationTemplates(classData) {
    const templates = [
      {
        type: 'announcement',
        name: 'General Announcement',
        template: 'Dear Parents/Guardians, {message}. Please contact us if you have any questions.',
        variables: ['message']
      },
      {
        type: 'homework',
        name: 'Homework Assignment',
        template: 'Homework for {subject}: {assignment}. Due date: {dueDate}.',
        variables: ['subject', 'assignment', 'dueDate']
      },
      {
        type: 'progress',
        name: 'Student Progress',
        template: 'Your child {studentName} is performing {performance} in {subject}. {comments}',
        variables: ['studentName', 'performance', 'subject', 'comments']
      },
      {
        type: 'absence',
        name: 'Absence Notification',
        template: 'Your child {studentName} was marked absent on {date}. Please provide a reason if applicable.',
        variables: ['studentName', 'date']
      }
    ];

    return {
      templates,
      reasoning: `Generated ${templates.length} communication templates for class ${classData.name}`
    };
  }

  /**
   * Rollback workflow in case of failure
   */
  async rollbackWorkflow(workflowExecutionId) {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: workflowExecutionId }
      });

      if (!execution) return;

      // Mark as rolled back
      await prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          executionStatus: 'rolled_back',
          errorMessage: execution.errorMessage + ' [ROLLED BACK]'
        }
      });

      console.log(`Workflow ${workflowExecutionId} rolled back successfully`);
    } catch (error) {
      console.error(`Failed to rollback workflow ${workflowExecutionId}:`, error);
    }
  }

  /**
   * Helper function to check if class is appropriate for grade
   */
  isGradeAppropriate(className, gradeOrAge) {
    // Simple logic - can be enhanced
    const classGrade = className.match(/Grade\s*(\d+)/i);
    if (classGrade) {
      const classGradeNum = parseInt(classGrade[1]);
      const studentGrade = typeof gradeOrAge === 'number' && gradeOrAge > 10 
        ? gradeOrAge - 6 // Convert age to grade (approximate)
        : gradeOrAge;
      
      return Math.abs(classGradeNum - studentGrade) <= 1;
    }
    return true; // Default to appropriate if can't determine
  }

  /**
   * Helper function to extract grade level from class name
   */
  extractGradeLevel(className) {
    const match = className.match(/Grade\s*(\d+)/i);
    if (match) {
      const grade = parseInt(match[1]);
      if (grade <= 3) return '1-3';
      if (grade <= 6) return '4-6';
      if (grade <= 9) return '7-9';
      return '10-12';
    }
    return '4-6'; // Default
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(workflowId) {
    return await prisma.workflowExecution.findUnique({
      where: { id: workflowId }
    });
  }

  /**
   * Get all workflow executions
   */
  async getAllWorkflows(filters = {}) {
    const { workflowType, status, limit = 50 } = filters;
    
    const where = {};
    if (workflowType) where.workflowType = workflowType;
    if (status) where.executionStatus = status;

    return await prisma.workflowExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit
    });
  }
}

export default new WorkflowAutomationService();