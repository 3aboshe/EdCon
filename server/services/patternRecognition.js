import { prisma } from '../config/db.js';

class PatternRecognitionService {
  constructor() {
    this.patternTypes = {
      ENTITY_CREATION: 'entity_creation',
      WORKFLOW_EXECUTION: 'workflow_execution',
      USER_BEHAVIOR: 'user_behavior',
      DATA_RELATIONSHIPS: 'data_relationships',
      SCHEDULING_PATTERNS: 'scheduling_patterns',
      COMMUNICATION_PATTERNS: 'communication_patterns'
    };
  }

  /**
   * Analyze patterns in data to recognize recurring behaviors
   * @param {string} patternType - Type of pattern to analyze
   * @param {object} data - Data to analyze
   * @returns {Promise<object>} - Pattern analysis results
   */
  async analyzePatterns(patternType, data = {}) {
    try {
      const analysis = {
        patternType,
        timestamp: new Date(),
        patterns: [],
        insights: [],
        confidenceFactors: {}
      };

      switch (patternType) {
        case this.patternTypes.ENTITY_CREATION:
          analysis.patterns.push(...await this.analyzeEntityCreationPatterns(data));
          analysis.insights.push(...this.getEntityCreationInsights(data));
          Object.assign(analysis.confidenceFactors, this.getEntityCreationConfidenceFactors(data));
          break;

        case this.patternTypes.WORKFLOW_EXECUTION:
          analysis.patterns.push(...await this.analyzeWorkflowExecutionPatterns(data));
          analysis.insights.push(...this.getWorkflowExecutionInsights(data));
          Object.assign(analysis.confidenceFactors, this.getWorkflowExecutionConfidenceFactors(data));
          break;

        case this.patternTypes.USER_BEHAVIOR:
          analysis.patterns.push(...await this.analyzeUserBehaviorPatterns(data));
          analysis.insights.push(...this.getUserBehaviorInsights(data));
          Object.assign(analysis.confidenceFactors, this.getUserBehaviorConfidenceFactors(data));
          break;

        case this.patternTypes.DATA_RELATIONSHIPS:
          analysis.patterns.push(...await this.analyzeDataRelationshipPatterns(data));
          analysis.insights.push(...this.getDataRelationshipInsights(data));
          Object.assign(analysis.confidenceFactors, this.getDataRelationshipConfidenceFactors(data));
          break;

        case this.patternTypes.SCHEDULING_PATTERNS:
          analysis.patterns.push(...await this.analyzeSchedulingPatterns(data));
          analysis.insights.push(...this.getSchedulingInsights(data));
          Object.assign(analysis.confidenceFactors, this.getSchedulingConfidenceFactors(data));
          break;

        case this.patternTypes.COMMUNICATION_PATTERNS:
          analysis.patterns.push(...await this.analyzeCommunicationPatterns(data));
          analysis.insights.push(...this.getCommunicationInsights(data));
          Object.assign(analysis.confidenceFactors, this.getCommunicationConfidenceFactors(data));
          break;

        default:
          throw new Error(`Unknown pattern type: ${patternType}`);
      }

      // Store pattern analysis
      await this.storePatternAnalysis(analysis);

      return {
        success: true,
        analysis,
        confidenceScore: this.calculatePatternConfidenceScore(analysis),
        insights: analysis.insights,
        reasoning: `Analyzed ${analysis.patterns.length} patterns for ${patternType}`
      };
    } catch (error) {
      console.error('Error in pattern recognition:', error);
      throw new Error(`Pattern recognition failed: ${error.message}`);
    }
  }

  /**
   * Analyze entity creation patterns
   */
  async analyzeEntityCreationPatterns(data) {
    const patterns = [];
    
    // Analyze student creation patterns
    if (data.students) {
      const studentCreationPattern = await this.analyzeStudentCreationPattern(data.students);
      if (studentCreationPattern) {
        patterns.push(studentCreationPattern);
      }
    }

    // Analyze teacher assignment patterns
    if (data.teachers) {
      const teacherAssignmentPattern = await this.analyzeTeacherAssignmentPattern(data.teachers);
      if (teacherAssignmentPattern) {
        patterns.push(teacherAssignmentPattern);
      }
    }

    // Analyze class configuration patterns
    if (data.classes) {
      const classConfigurationPattern = await this.analyzeClassConfigurationPattern(data.classes);
      if (classConfigurationPattern) {
        patterns.push(classConfigurationPattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze workflow execution patterns
   */
  async analyzeWorkflowExecutionPatterns(data) {
    const patterns = [];
    
    // Analyze student creation workflow patterns
    if (data.studentCreationWorkflows) {
      const workflowPattern = await this.analyzeStudentCreationWorkflowPattern(data.studentCreationWorkflows);
      if (workflowPattern) {
        patterns.push(workflowPattern);
      }
    }

    // Analyze teacher assignment workflow patterns
    if (data.teacherAssignmentWorkflows) {
      const workflowPattern = await this.analyzeTeacherAssignmentWorkflowPattern(data.teacherAssignmentWorkflows);
      if (workflowPattern) {
        patterns.push(workflowPattern);
      }
    }

    // Analyze class configuration workflow patterns
    if (data.classConfigurationWorkflows) {
      const workflowPattern = await this.analyzeClassConfigurationWorkflowPattern(data.classConfigurationWorkflows);
      if (workflowPattern) {
        patterns.push(workflowPattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehaviorPatterns(data) {
    const patterns = [];
    
    // Analyze login patterns
    if (data.logins) {
      const loginPattern = await this.analyzeLoginPattern(data.logins);
      if (loginPattern) {
        patterns.push(loginPattern);
      }
    }

    // Analyze feature usage patterns
    if (data.featureUsage) {
      const featureUsagePattern = await this.analyzeFeatureUsagePattern(data.featureUsage);
      if (featureUsagePattern) {
        patterns.push(featureUsagePattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze data relationship patterns
   */
  async analyzeDataRelationshipPatterns(data) {
    const patterns = [];
    
    // Analyze parent-child relationship patterns
    if (data.parentChildRelationships) {
      const relationshipPattern = await this.analyzeParentChildRelationshipPattern(data.parentChildRelationships);
      if (relationshipPattern) {
        patterns.push(relationshipPattern);
      }
    }

    // Analyze student-class relationship patterns
    if (data.studentClassRelationships) {
      const relationshipPattern = await this.analyzeStudentClassRelationshipPattern(data.studentClassRelationships);
      if (relationshipPattern) {
        patterns.push(relationshipPattern);
      }
    }

    // Analyze teacher-class relationship patterns
    if (data.teacherClassRelationships) {
      const relationshipPattern = await this.analyzeTeacherClassRelationshipPattern(data.teacherClassRelationships);
      if (relationshipPattern) {
        patterns.push(relationshipPattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze scheduling patterns
   */
  async analyzeSchedulingPatterns(data) {
    const patterns = [];
    
    // Analyze homework scheduling patterns
    if (data.homeworkSchedules) {
      const homeworkPattern = await this.analyzeHomeworkSchedulingPattern(data.homeworkSchedules);
      if (homeworkPattern) {
        patterns.push(homeworkPattern);
      }
    }

    // Analyze class scheduling patterns
    if (data.classSchedules) {
      const classSchedulePattern = await this.analyzeClassSchedulePattern(data.classSchedules);
      if (classSchedulePattern) {
        patterns.push(classSchedulePattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze communication patterns
   */
  async analyzeCommunicationPatterns(data) {
    const patterns = [];
    
    // Analyze message patterns
    if (data.messages) {
      const messagePattern = await this.analyzeMessagePattern(data.messages);
      if (messagePattern) {
        patterns.push(messagePattern);
      }
    }

    // Analyze announcement patterns
    if (data.announcements) {
      const announcementPattern = await this.analyzeAnnouncementPattern(data.announcements);
      if (announcementPattern) {
        patterns.push(announcementPattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze student creation pattern
   */
  async analyzeStudentCreationPattern(students) {
    // Group students by creation date
    const studentsByDate = this.groupByDate(students, 'createdAt');
    
    // Check for batch creation patterns
    const batchSizes = Object.values(studentsByDate).map(dateGroup => dateGroup.length);
    const avgBatchSize = batchSizes.reduce((sum, size) => sum + size, 0) / batchSizes.length;
    
    // Check for naming patterns
    const namePatterns = this.analyzeNamingPatterns(students.map(s => s.name));
    
    // Check for age/grade patterns
    const ageGradePatterns = this.analyzeAgeGradePatterns(students.map(s => ({ age: s.age, grade: s.grade })));

    return {
      type: 'student_creation_batch',
      frequency: batchSizes.length > 1 ? 'batch' : 'individual',
      avgBatchSize: avgBatchSize.toFixed(1),
      batchSize: Math.max(...batchSizes),
      namePatterns,
      ageGradePatterns,
      confidence: batchSizes.length > 1 ? 0.8 : 0.6
    };
  }

  /**
   * Analyze teacher assignment pattern
   */
  async analyzeTeacherAssignmentPattern(teachers) {
    // Group teachers by subject
    const teachersBySubject = this.groupByProperty(teachers, 'subject');
    
    // Check for workload patterns
    const workloads = teachers.map(t => t.classIds?.length || 0);
    const avgWorkload = workloads.reduce((sum, load) => sum + load, 0) / workloads.length;
    const maxWorkload = Math.max(...workloads);
    
    // Check for class preference patterns
    const classPreferences = this.analyzeClassPreferences(teachers);

    return {
      type: 'teacher_assignment_workload',
      avgWorkload: avgWorkload.toFixed(1),
      maxWorkload,
      workloadDistribution: this.calculateDistribution(workloads),
      subjectDistribution: Object.keys(teachersBySubject).map(subject => ({
        subject,
        count: teachersBySubject[subject].length
      })),
      classPreferences,
      confidence: avgWorkload < 5 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze class configuration pattern
   */
  async analyzeClassConfigurationPattern(classes) {
    // Group classes by grade level
    const classesByGrade = this.groupByGradeLevel(classes);
    
    // Check for subject combination patterns
    const subjectCombinations = classes.map(c => c.subjectIds?.sort() || []);
    const commonCombinations = this.findCommonSubjectCombinations(subjectCombinations);
    
    // Check for capacity patterns
    const capacities = classes.map(c => c.maxCapacity || 30);
    const avgCapacity = capacities.reduce((sum, cap) => sum + cap, 0) / capacities.length;

    return {
      type: 'class_configuration_subjects',
      gradeDistribution: Object.keys(classesByGrade).map(grade => ({
        grade,
        count: classesByGrade[grade].length
      })),
      subjectCombinations: commonCombinations,
      avgCapacity: avgCapacity.toFixed(1),
      capacityUtilization: this.calculateDistribution(capacities),
      confidence: commonCombinations.length > 0 ? 0.8 : 0.6
    };
  }

  /**
   * Analyze student creation workflow pattern
   */
  async analyzeStudentCreationWorkflowPattern(workflows) {
    // Group workflows by completion status
    const workflowsByStatus = this.groupByProperty(workflows, 'executionStatus');
    
    // Check for step completion patterns
    const stepCompletions = workflows.map(w => w.stepsCompleted?.length || 0);
    const avgSteps = stepCompletions.reduce((sum, steps) => sum + steps, 0) / stepCompletions.length;
    
    // Check for time patterns
    const durations = workflows.map(w => {
      if (w.startedAt && w.completedAt) {
        return new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime();
      }
      return 0;
    }).filter(d => d > 0);
    
    const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

    return {
      type: 'student_creation_workflow_efficiency',
      completionRate: (workflowsByStatus.completed?.length || 0) / workflows.length,
      avgStepsPerWorkflow: avgSteps.toFixed(1),
      avgDuration: (avgDuration / (1000 * 60)).toFixed(2), // in minutes
      stepCompletionRate: avgSteps > 4 ? 0.8 : 0.6,
      confidence: avgDuration < 5 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze teacher assignment workflow pattern
   */
  async analyzeTeacherAssignmentWorkflowPattern(workflows) {
    // Group workflows by success rate
    const workflowsByStatus = this.groupByProperty(workflows, 'executionStatus');
    
    // Check for auto-assignment patterns
    const autoAssignments = workflows.filter(w => w.resultData?.autoAssignClasses);
    const autoAssignmentRate = autoAssignments.length / workflows.length;
    
    // Check for manual override patterns
    const manualOverrides = workflows.filter(w => w.resultData?.manualOverrides);
    const manualOverrideRate = manualOverrides.length / workflows.length;

    return {
      type: 'teacher_assignment_automation',
      autoAssignmentRate: autoAssignmentRate.toFixed(2),
      manualOverrideRate: manualOverrideRate.toFixed(2),
      automationAcceptance: autoAssignmentRate > 0.7 ? 0.8 : 0.4,
      confidence: autoAssignmentRate > 0.5 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze class configuration workflow pattern
   */
  async analyzeClassConfigurationWorkflowPattern(workflows) {
    // Group workflows by subject suggestions
    const workflowsByStatus = this.groupByProperty(workflows, 'executionStatus');
    
    // Check for suggestion acceptance patterns
    const acceptedSuggestions = workflows.filter(w => w.resultData?.suggestionsAccepted);
    const suggestionAcceptanceRate = acceptedSuggestions.length / workflows.length;
    
    // Check for template usage patterns
    const templateUsage = workflows.filter(w => w.resultData?.templateUsed);
    const templateUsageRate = templateUsage.length / workflows.length;

    return {
      type: 'class_configuration_suggestions',
      suggestionAcceptanceRate: suggestionAcceptanceRate.toFixed(2),
      templateUsageRate: templateUsageRate.toFixed(2),
      automationEffectiveness: suggestionAcceptanceRate > 0.6 ? 0.8 : 0.5,
      confidence: suggestionAcceptanceRate > 0.4 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze login pattern
   */
  async analyzeLoginPattern(logins) {
    // Group logins by time of day
    const loginsByHour = this.groupByHour(logins, 'timestamp');
    
    // Check for peak usage times
    const peakHours = Object.entries(loginsByHour)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }));
    
    // Check for day-of-week patterns
    const loginsByDay = this.groupByDayOfWeek(logins, 'timestamp');
    const peakDay = Object.entries(loginsByDay)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 1)[0];

    return {
      type: 'login_usage_patterns',
      peakHours,
      peakDay: peakDay.day,
      dailyAverage: Object.values(loginsByDay).reduce((sum, count) => sum + count, 0) / Object.keys(loginsByDay).length,
      confidence: peakHours.length > 0 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze feature usage pattern
   */
  async analyzeFeatureUsagePattern(featureUsage) {
    // Group features by usage frequency
    const featuresByUsage = this.groupByUsage(featureUsage, 'usageCount');
    
    // Check for adoption rates
    const totalUsage = Object.values(featuresByUsage).reduce((sum, usage) => sum + usage.usageCount, 0);
    const sortedFeatures = Object.entries(featuresByUsage)
      .sort(([, a], [, b]) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    // Check for underutilized features
    const underutilizedFeatures = sortedFeatures.filter(([, usage]) => usage.usageCount < 5);
    const underutilizationRate = underutilizedFeatures.length / sortedFeatures.length;

    return {
      type: 'feature_adoption_patterns',
      mostUsedFeatures: sortedFeatures.slice(0, 5).map(([name]) => name),
      underutilizedFeatures: underutilizedFeatures.map(([name]) => name),
      underutilizationRate: underutilizationRate.toFixed(2),
      confidence: underutilizationRate < 0.3 ? 0.8 : 0.6
    };
  }

  /**
   * Analyze parent-child relationship pattern
   */
  async analyzeParentChildRelationshipPattern(relationships) {
    // Group relationships by connection strength
    const relationshipsByStrength = this.groupByProperty(relationships, 'connectionStrength');
    
    // Check for multiple parent assignments
    const childrenByParent = this.groupChildrenByParent(relationships);
    const multipleParentAssignments = Object.entries(childrenByParent)
      .filter(([, children]) => children.length > 1);
    
    // Check for orphaned students
    const orphanedStudents = relationships
      .filter(r => r.type === 'parent_child' && !r.source.parentId)
      .map(r => r.target);

    return {
      type: 'parent_child_connection_patterns',
      multipleParentAssignments: multipleParentAssignments.length,
      orphanedStudents: orphanedStudents.length,
      connectionStrengthDistribution: this.calculateDistribution(relationships.map(r => r.connectionStrength || 0.5)),
      confidence: multipleParentAssignments.length === 0 ? 0.8 : 0.6
    };
  }

  /**
   * Analyze student-class relationship pattern
   */
  async analyzeStudentClassRelationshipPattern(relationships) {
    // Group relationships by class
    const relationshipsByClass = this.groupByProperty(relationships, 'classId');
    
    // Check for class balance
    const classSizes = Object.entries(relationshipsByClass)
      .map(([classId, relationships]) => relationships.length);
    
    const avgClassSize = classSizes.reduce((sum, [_, size]) => sum + size, 0) / classSizes.length;
    const maxClassSize = Math.max(...classSizes.map(([_, size]) => size));
    const minClassSize = Math.min(...classSizes.map(([_, size]) => size));
    
    // Check for unassigned students
    const unassignedStudents = relationships
      .filter(r => r.type === 'student_class' && !r.target.classId)
      .map(r => r.target);

    return {
      type: 'student_class_distribution',
      avgClassSize: avgClassSize.toFixed(1),
      classSizeDistribution: this.calculateDistribution(classSizes.map(([_, size]) => size)),
      unassignedStudents: unassignedStudents.length,
      balanceScore: 1 - (maxClassSize - minClassSize) / maxClassSize,
      confidence: unassignedStudents.length === 0 ? 0.8 : 0.6
    };
  }

  /**
   * Analyze teacher-class relationship pattern
   */
  async analyzeTeacherClassRelationshipPattern(relationships) {
    // Group relationships by teacher
    const relationshipsByTeacher = this.groupByProperty(relationships, 'teacherId');
    
    // Check for subject specialization
    const teacherSubjects = relationships
      .filter(r => r.type === 'teacher_class')
      .map(r => ({
        teacherId: r.source,
        subject: r.source.subject,
        classId: r.target.classId
      }));
    
    const subjectsByTeacher = this.groupByProperty(teacherSubjects, 'teacherId');
    
    // Check for workload balance
    const teacherWorkloads = Object.entries(subjectsByTeacher)
      .map(([teacherId, classes]) => classes.length);
    
    const avgWorkload = teacherWorkloads.reduce((sum, [_, workload]) => sum + workload, 0) / teacherWorkloads.length;
    const maxWorkload = Math.max(...teacherWorkloads.map(([_, workload]) => workload));
    
    return {
      type: 'teacher_class_specialization',
      subjectDistribution: Object.entries(subjectsByTeacher).map(([teacherId, classes]) => ({
        teacherId,
        subject: classes[0]?.subject,
        classCount: classes.length
      })),
      avgWorkload: avgWorkload.toFixed(1),
      maxWorkload,
      workloadBalance: 1 - (maxWorkload / avgWorkload),
      confidence: avgWorkload < 5 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze homework scheduling pattern
   */
  async analyzeHomeworkSchedulingPattern(schedules) {
    // Group schedules by day of week
    const schedulesByDay = this.groupByProperty(schedules, 'dueDay');
    
    // Check for advance notice patterns
    const advanceNotices = schedules.filter(s => {
      const daysUntilDue = this.calculateDaysUntil(s.dueDate);
      return daysUntilDue > 7 && daysUntilDue <= 14; // More than a week but less than 2 weeks
    });
    
    const advanceNoticeRate = advanceNotices.length / schedules.length;
    
    // Check for due date clustering
    const dueDates = schedules.map(s => new Date(s.dueDate));
    const dueDateClusters = this.clusterDates(dueDates);
    
    return {
      type: 'homework_scheduling_patterns',
      advanceNoticeRate: advanceNoticeRate.toFixed(2),
      dueDateClusters: dueDateClusters.map(cluster => ({
        dateRange: cluster.dateRange,
        count: cluster.dates.length
      })),
      schedulingConsistency: advanceNoticeRate < 0.3 ? 0.8 : 0.6,
      confidence: dueDateClusters.length > 1 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze class schedule pattern
   */
  async analyzeClassSchedulePattern(schedules) {
    // Group schedules by time
    const schedulesByTime = this.groupByProperty(schedules, 'startTime');
    
    // Check for optimal scheduling
    const timeSlots = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00'];
    const optimalSlots = schedules.filter(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 8 && hour <= 14; // Business hours
    });
    
    const optimalSchedulingRate = optimalSlots.length / schedules.length;
    
    return {
      type: 'class_scheduling_optimization',
      optimalSchedulingRate: optimalSchedulingRate.toFixed(2),
      timeSlotDistribution: this.calculateTimeSlotDistribution(schedules),
      confidence: optimalSchedulingRate > 0.6 ? 0.8 : 0.5
    };
  }

  /**
   * Analyze message pattern
   */
  async analyzeMessagePattern(messages) {
    // Group messages by type
    const messagesByType = this.groupByProperty(messages, 'type');
    
    // Check for response time patterns
    const responseTimes = messages
      .filter(m => m.type === 'text' && m.senderRole === 'teacher')
      .map(m => {
        const sentTime = new Date(m.timestamp).getTime();
        const responseTime = m.responseTime ? new Date(m.responseTime).getTime() : null;
        
        return responseTime ? {
          sentTime,
          responseTime,
          responseDuration: responseTime - sentTime
        } : null;
      })
      .filter(rt => rt !== null);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + (rt.responseDuration || 0), 0) / responseTimes.length 
      : null;
    
    // Check for message length patterns
    const messageLengths = messages
      .filter(m => m.type === 'text')
      .map(m => m.content?.length || 0);
    
    const avgMessageLength = messageLengths.reduce((sum, length) => sum + length, 0) / messageLengths.length;

    return {
      type: 'communication_response_patterns',
      avgResponseTime: avgResponseTime ? (avgResponseTime / (1000 * 60)).toFixed(2) : null, // in hours
      messageLengthDistribution: this.calculateDistribution(messageLengths),
      avgMessageLength: avgMessageLength.toFixed(0),
      confidence: avgResponseTime && avgResponseTime < 24 ? 0.7 : 0.5
    };
  }

  /**
   * Analyze announcement pattern
   */
  async analyzeAnnouncementPattern(announcements) {
    // Group announcements by priority
    const announcementsByPriority = this.groupByProperty(announcements, 'priority');
    
    // Check for timing patterns
    const announcementTimes = announcements.map(a => new Date(a.date).getTime());
    const sortedTimes = announcementTimes.sort((a, b) => a - b);
    
    // Check for optimal announcement timing
    const optimalTimes = sortedTimes.filter((time, index) => {
      if (index === 0) return true; // First announcement
      if (index === sortedTimes.length - 1) return true; // Last announcement
      return false;
    });
    
    const optimalTimingRate = optimalTimes.length / announcementTimes.length;

    return {
      type: 'announcement_timing_patterns',
      optimalTimingRate: optimalTimingRate.toFixed(2),
      priorityDistribution: Object.entries(announcementsByPriority).map(([priority, announcements]) => ({
        priority,
        count: announcements.length
      })),
      confidence: optimalTimingRate > 0.5 ? 0.7 : 0.5
    };
  }

  /**
   * Get insights for entity creation patterns
   */
  getEntityCreationInsights(data) {
    return [
      {
        type: 'batch_creation_efficiency',
        title: 'Batch Creation Efficiency',
        description: 'Analyze the efficiency of batch entity creation processes',
        recommendation: data.students?.length > 10 
          ? 'Consider implementing automated batch creation workflows' 
          : 'Current individual creation process is efficient'
      },
      {
        type: 'naming_consistency',
        title: 'Naming Consistency',
        description: 'Check for consistent naming patterns across entities',
        recommendation: 'Establish naming conventions for better data organization'
      },
      {
        type: 'data_quality',
        title: 'Data Quality Assessment',
        description: 'Evaluate the quality and completeness of entity data',
        recommendation: 'Implement data validation rules to improve data quality'
      }
    ];
  }

  /**
   * Get insights for workflow execution patterns
   */
  getWorkflowExecutionInsights(data) {
    return [
      {
        type: 'workflow_efficiency',
        title: 'Workflow Efficiency',
        description: 'Analyze the efficiency and success rate of workflow executions',
        recommendation: data.studentCreationWorkflows?.some(w => w.executionStatus === 'failed')
          ? 'Review and fix common failure points in student creation workflows'
          : 'Current workflow success rate is good'
      },
      {
        type: 'automation_effectiveness',
        title: 'Automation Effectiveness',
        description: 'Evaluate how well automation suggestions are being accepted',
        recommendation: data.teacherAssignmentWorkflows?.some(w => !w.resultData?.autoAssignClasses)
          ? 'Encourage acceptance of automation suggestions to improve efficiency'
          : 'Automation suggestions are being well utilized'
      }
    ];
  }

  /**
   * Get insights for user behavior patterns
   */
  getUserBehaviorInsights(data) {
    return [
      {
        type: 'engagement_patterns',
        title: 'User Engagement Patterns',
        description: 'Analyze how and when users interact with the system',
        recommendation: data.logins?.length > 0 
          ? 'Users are actively engaging with the system'
          : 'Consider implementing user engagement features'
      },
      {
        type: 'feature_adoption',
        title: 'Feature Adoption',
        description: 'Evaluate the adoption rate of new features',
        recommendation: data.featureUsage?.some(f => f.usageCount > 10)
          ? 'Features are being well utilized'
          : 'Consider promoting underutilized features'
      }
    ];
  }

  /**
   * Get insights for data relationship patterns
   */
  getDataRelationshipInsights(data) {
    return [
      {
        type: 'relationship_integrity',
        title: 'Relationship Integrity',
        description: 'Evaluate the completeness and accuracy of data relationships',
        recommendation: data.orphanedStudents?.length > 0
          ? 'Review and resolve orphaned student records'
          : 'Data relationships are well maintained'
      },
      {
        type: 'data_balance',
        title: 'Data Balance',
        description: 'Check for balanced distribution across entities',
        recommendation: data.studentClassRelationships?.some(r => {
          const classSize = r.target?.students?.length || 0;
          return classSize > 35 || classSize < 15;
        })
          ? 'Address class size imbalances for better learning outcomes'
          : 'Class sizes are well balanced'
      }
    ];
  }

  /**
   * Get insights for scheduling patterns
   */
  getSchedulingInsights(data) {
    return [
      {
        type: 'scheduling_efficiency',
        title: 'Scheduling Efficiency',
        description: 'Evaluate the efficiency and optimization of scheduling processes',
        recommendation: data.homeworkSchedules?.some(s => s.advanceNotice)
          ? 'Advance notice periods are being used effectively'
          : 'Consider implementing advance notice features for homework'
      },
      {
        type: 'resource_utilization',
        title: 'Resource Utilization',
        description: 'Analyze how effectively resources (time, rooms) are being utilized',
        recommendation: data.classSchedules?.some(s => {
          const hour = new Date(s.startTime).getHours();
          return hour >= 8 && hour <= 14;
        })
          ? 'Class schedules are optimized for business hours'
          : 'Consider adjusting class schedules to better utilize resources'
      }
    ];
  }

  /**
   * Get insights for communication patterns
   */
  getCommunicationInsights(data) {
    return [
      {
        type: 'communication_effectiveness',
        title: 'Communication Effectiveness',
        description: 'Evaluate the effectiveness and timeliness of communications',
        recommendation: data.messages?.some(m => {
          const responseTime = m.responseTime ? new Date(m.responseTime).getTime() - new Date(m.timestamp).getTime() : null;
          return responseTime && (responseTime - new Date(m.timestamp).getTime()) < 24 * 60 * 1000; // Less than 24 hours
        })
          ? 'Communication response times are within acceptable ranges'
          : 'Improve communication response times for better engagement'
      },
      {
        type: 'message_clarity',
        title: 'Message Clarity',
        description: 'Evaluate the clarity and effectiveness of message content',
        recommendation: data.messages?.some(m => m.type === 'text' && m.content?.length > 500)
          ? 'Consider breaking down long messages into shorter, more focused communications'
          : 'Message length and clarity are appropriate'
      }
    ];
  }

  /**
   * Get confidence factors for entity creation patterns
   */
  getEntityCreationConfidenceFactors(data) {
    return {
      batchConsistency: data.students?.length > 5 ? 0.8 : 0.5,
      namingConsistency: this.calculateNamingConsistency(data.students?.map(s => s.name) || []) > 0.7 ? 0.7 : 0.5,
      dataCompleteness: this.calculateDataCompleteness(data.students || []) > 0.8 ? 0.8 : 0.5
    };
  }

  /**
   * Get confidence factors for workflow execution patterns
   */
  getWorkflowExecutionConfidenceFactors(data) {
    const successRate = (data.studentCreationWorkflows?.filter(w => w.executionStatus === 'completed')?.length || 0) / (data.studentCreationWorkflows?.length || 1);
    
    return {
      successRate: successRate > 0.8 ? 0.9 : 0.6,
      stepCompletionRate: data.studentCreationWorkflows?.some(w => (w.stepsCompleted?.length || 0) > 4) ? 0.8 : 0.6,
      timeEfficiency: data.studentCreationWorkflows?.some(w => {
        const duration = w.completedAt && w.startedAt 
          ? new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime()
          : 0;
        return duration < 5 * 60 * 1000; // Less than 5 minutes
      }) ? 0.8 : 0.5
    };
  }

  /**
   * Get confidence factors for user behavior patterns
   */
  getUserBehaviorConfidenceFactors(data) {
    const loginFrequency = data.logins?.length || 0;
    const daysSinceFirstLogin = data.logins?.length > 0 
      ? (new Date().getTime() - new Date(data.logins[0].timestamp).getTime()) / (24 * 60 * 1000)
      : 0;
    
    return {
      loginFrequency: loginFrequency > 10 ? 0.8 : 0.5,
      engagementConsistency: daysSinceFirstLogin > 7 ? 0.7 : 0.5,
      featureAdoption: data.featureUsage?.some(f => f.usageCount > 5) ? 0.8 : 0.5
    };
  }

  /**
   * Get confidence factors for data relationship patterns
   */
  getDataRelationshipConfidenceFactors(data) {
    const relationshipCompleteness = this.calculateRelationshipCompleteness(data);
    const balanceScore = this.calculateRelationshipBalance(data);
    
    return {
      relationshipCompleteness: relationshipCompleteness > 0.8 ? 0.9 : 0.6,
      balanceScore: balanceScore > 0.7 ? 0.8 : 0.5,
      orphanedRecords: data.orphanedStudents?.length === 0 ? 0.8 : 0.4
    };
  }

  /**
   * Get confidence factors for scheduling patterns
   */
  getSchedulingConfidenceFactors(data) {
    const advanceNoticeRate = data.homeworkSchedules?.filter(s => s.advanceNotice).length / (data.homeworkSchedules?.length || 1);
    const optimalSchedulingRate = data.classSchedules?.filter(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 8 && hour <= 14; // Business hours
    }).length / (data.classSchedules?.length || 1);
    
    return {
      advanceNoticeRate: advanceNoticeRate > 0.5 ? 0.8 : 0.6,
      optimalSchedulingRate: optimalSchedulingRate > 0.6 ? 0.8 : 0.5,
      resourceUtilization: optimalSchedulingRate > 0.7 ? 0.8 : 0.5
    };
  }

  /**
   * Get confidence factors for communication patterns
   */
  getCommunicationConfidenceFactors(data) {
    const avgResponseTime = data.messages?.filter(m => m.type === 'text' && m.responseTime)
      .map(m => {
        const sentTime = new Date(m.timestamp).getTime();
        const responseTime = m.responseTime ? new Date(m.responseTime).getTime() : null;
        return responseTime ? (responseTime - sentTime) / (1000 * 60) : null;
      })
      .filter(rt => rt !== null)
      .reduce((sum, rt) => sum + (rt.responseDuration || 0), 0) / (rt.filter(rt => rt !== null).length || 1);
    
    const responseRate = avgResponseTime && avgResponseTime < 24 * 60 * 1000 ? 0.8 : 0.5;
    
    return {
      responseRate: responseRate > 0.7 ? 0.8 : 0.5,
      messageClarity: data.messages?.some(m => m.type === 'text' && m.content?.length < 200) ? 0.8 : 0.6,
      messageLength: data.messages?.filter(m => m.type === 'text')
        .map(m => m.content?.length || 0)
        .reduce((sum, length) => sum + length, 0) / (data.messages?.filter(m => m.type === 'text').length || 1) < 100 ? 0.7 : 0.5
    };
  }

  /**
   * Calculate overall pattern confidence score
   */
  calculatePatternConfidenceScore(analysis) {
    const weights = {
      pattern_frequency: 0.3,
      pattern_consistency: 0.3,
      insight_relevance: 0.2,
      historical_accuracy: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Calculate weighted score based on confidence factors
    for (const factor of Object.keys(analysis.confidenceFactors)) {
      const weight = weights[factor] || 0.5;
      const factorValue = analysis.confidenceFactors[factor] || 0.5;
      
      totalScore += weight * factorValue;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Helper methods for pattern analysis
   */
  groupByDate(items, dateField) {
    const grouped = {};
    
    for (const item of items) {
      const date = new Date(item[dateField]);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(item);
    }
    
    return grouped;
  }

  groupByProperty(items, property) {
    const grouped = {};
    
    for (const item of items) {
      const key = item[property];
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(item);
    }
    
    return grouped;
  }

  groupChildrenByParent(relationships) {
    const grouped = {};
    
    for (const relationship of relationships) {
      if (relationship.type === 'parent_child' && relationship.source.parentId) {
        const parentId = relationship.source.parentId;
        
        if (!grouped[parentId]) {
          grouped[parentId] = [];
        }
        
        grouped[parentId].push(relationship.target);
      }
    }
    
    return grouped;
  }

  groupByGradeLevel(classes) {
    const grouped = {
      '1-3': [],
      '4-6': [],
      '7-9': [],
      '10-12': []
    };
    
    for (const cls of classes) {
      const grade = this.extractGradeFromClass(cls.name);
      
      if (grade >= 1 && grade <= 3) {
        grouped['1-3'].push(cls);
      } else if (grade >= 4 && grade <= 6) {
        grouped['4-6'].push(cls);
      } else if (grade >= 7 && grade <= 9) {
        grouped['7-9'].push(cls);
      } else if (grade >= 10 && grade <= 12) {
        grouped['10-12'].push(cls);
      }
    }
    
    return grouped;
  }

  extractGradeFromClass(className) {
    const match = className.match(/Grade\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  calculateDistribution(values) {
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return {
      values,
      average: avg,
      max,
      min,
      range: max - min,
      distribution: values.map(val => ({
        value: val,
        percentage: (val / total) * 100
      }))
    };
  }

  calculateTimeSlotDistribution(schedules) {
    const timeSlots = {
      'Early Morning (6-8)': 0,
      'Late Morning (8-10)': 0,
      'Midday (10-14)': 0,
      'Early Afternoon (14-16)': 0,
      'Late Afternoon (16-18)': 0,
      'Evening (18-20)': 0
    };
    
    for (const schedule of schedules) {
      const hour = new Date(schedule.startTime).getHours();
      
      if (hour >= 6 && hour < 8) {
        timeSlots['Early Morning (6-8)']++;
      } else if (hour >= 8 && hour < 10) {
        timeSlots['Late Morning (8-10)']++;
      } else if (hour >= 10 && hour < 14) {
        timeSlots['Midday (10-14)']++;
      } else if (hour >= 14 && hour < 16) {
        timeSlots['Early Afternoon (14-16)']++;
      } else if (hour >= 16 && hour < 18) {
        timeSlots['Late Afternoon (16-18)']++;
      } else if (hour >= 18 && hour < 20) {
        timeSlots['Evening (18-20)']++;
      }
    }
    
    return timeSlots;
  }

  calculateNamingConsistency(names) {
    if (names.length === 0) return 0;
    
    // Check for common prefixes
    const prefixes = names.map(name => name.split(' ')[0]).toLowerCase());
    const commonPrefixes = ['mr', 'mrs', 'miss', 'dr', 'st'];
    const prefixConsistency = prefixes.filter(p => commonPrefixes.includes(p)).length / prefixes.length;
    
    // Check for common suffixes
    const suffixes = names.map(name => name.split(' ').pop()?.toLowerCase());
    const commonSuffixes = ['jr', 'sr', 'ii', 'iii'];
    const suffixConsistency = suffixes.filter(s => commonSuffixes.includes(s)).length / suffixes.length;
    
    // Check for case consistency
    const cases = names.map(name => name.split(' ').map(word => word.charAt(0).toUpperCase() === word.charAt(0).toUpperCase()));
    const caseConsistency = cases.filter(c => c).length / cases.length;
    
    return (prefixConsistency + suffixConsistency + caseConsistency) / 3;
  }

  calculateDataCompleteness(data) {
    if (data.length === 0) return 0;
    
    const requiredFields = ['name', 'email', 'role'];
    const completenessScores = data.map(item => {
      const filledFields = requiredFields.filter(field => item[field]);
      return filledFields.length / requiredFields.length;
    });
    
    const avgCompleteness = completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;
    
    return avgCompleteness;
  }

  calculateRelationshipCompleteness(data) {
    const totalEntities = data.length || 0;
    if (totalEntities === 0) return 1;
    
    const completeRelationships = data.filter(item => 
      (item.type === 'parent_child' && item.source.parentId && item.target.id) ||
      (item.type === 'student_class' && item.source.id && item.target.classId) ||
      (item.type === 'teacher_class' && item.source.id && item.target.classId)
    ).length;
    
    return completeRelationships / totalEntities;
  }

  calculateRelationshipBalance(data) {
    const entityCounts = {};
    
    // Count entities by type
    for (const item of data) {
      const type = item.type;
      entityCounts[type] = (entityCounts[type] || 0) + 1;
    }
    
    // Calculate balance score (closer to equal distribution is better)
    const totalTypes = Object.keys(entityCounts).length;
    const maxCount = Math.max(...Object.values(entityCounts));
    const minCount = Math.min(...Object.values(entityCounts));
    
    let balanceScore = 0;
    for (const count of Object.values(entityCounts)) {
      const deviation = Math.abs(count - (maxCount + minCount) / 2);
      balanceScore += 1 - (deviation / ((maxCount - minCount) / 2));
    }
    
    return balanceScore / totalTypes;
  }

  findCommonSubjectCombinations(subjectCombinations) {
    const combinationCounts = {};
    
    for (const combinations of subjectCombinations) {
      const key = combinations.sort().join(',');
      combinationCounts[key] = (combinationCounts[key] || 0) + 1;
    }
    
    // Find most common combinations
    const sortedCombinations = Object.entries(combinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([combination, count]) => ({ combination, count }));
    
    return sortedCombinations;
  }

  clusterDates(dates) {
    if (dates.length === 0) return [];
    
    const sortedDates = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const clusters = [];
    let currentCluster = {
      dates: [sortedDates[0]],
      dateRange: this.formatDateRange(sortedDates[0], sortedDates[0])
    };
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const prevDate = sortedDates[i - 1];
      
      // Check if this date belongs to the current cluster (within 7 days)
      if (currentDate.getTime() - prevDate.getTime() <= 7 * 24 * 60 * 1000) {
        currentCluster.dates.push(currentDate);
        currentCluster.dateRange = this.formatDateRange(
          currentCluster.dates[0],
          currentDate
        );
      } else {
        // Start a new cluster
        clusters.push(currentCluster);
        currentCluster = {
          dates: [currentDate],
          dateRange: this.formatDateRange(currentDate, currentDate)
        };
      }
    }
    
    return clusters;
  }

  formatDateRange(startDate, endDate) {
    const options = { month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }

  calculateDaysUntil(date) {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (24 * 60 * 1000));
    return Math.max(0, diffDays);
  }

  /**
   * Store pattern analysis in database
   */
  async storePatternAnalysis(analysis) {
    try {
      await prisma.learnedPattern.create({
        data: {
          patternType: analysis.patternType,
          patterns: analysis.patterns,
          insights: analysis.insights,
          confidenceFactors: analysis.confidenceFactors,
          confidenceScore: this.calculatePatternConfidenceScore(analysis),
          timestamp: analysis.timestamp
        },
        successCount: analysis.patterns.length,
        failureCount: 0
      });
    } catch (error) {
      console.error('Error storing pattern analysis:', error);
    }
  }

  /**
   * Get learned patterns for a specific type
   */
  async getLearnedPatterns(patternType, limit = 20) {
    try {
      const patterns = await prisma.learnedPattern.findMany({
        where: {
          patternType,
          successCount: {
            gte: 1
          }
        },
        orderBy: {
          confidenceScore: 'desc'
        },
        take: limit
      });

      return patterns.map(pattern => ({
        ...pattern.data,
        id: pattern.id,
        learnedAt: pattern.createdAt
      }));
    } catch (error) {
      console.error('Error getting learned patterns:', error);
      return [];
    }
  }

  /**
   * Update pattern success/failure based on usage
   */
  async updatePatternUsage(patternId, success) {
    try {
      const pattern = await prisma.learnedPattern.findUnique({
        where: { id: patternId }
      });

      if (!pattern) {
        throw new Error('Pattern not found');
      }

      const currentSuccessCount = pattern.successCount || 0;
      const currentFailureCount = pattern.failureCount || 0;
      
      await prisma.learnedPattern.update({
        where: { id: patternId },
        data: {
          successCount: success ? currentSuccessCount + 1 : currentSuccessCount,
          failureCount: success ? currentFailureCount : currentFailureCount + 1,
          lastUsed: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating pattern usage:', error);
    }
  }
}

export default new PatternRecognitionService();