import { prisma } from '../config/db.js';

class RelationshipEngineService {
  constructor() {
    this.relationshipTypes = {
      STUDENT_CLASS: 'student_class',
      TEACHER_CLASS: 'teacher_class',
      PARENT_CHILD: 'parent_child',
      CLASS_SUBJECT: 'class_subject',
      TEACHER_SUBJECT: 'teacher_subject'
    };
  }

  /**
   * Infer and establish relationships between entities
   * @param {string} entityType - Type of entity to analyze
   * @param {string} entityId - ID of the entity
   * @param {object} context - Additional context for relationship inference
   * @returns {Promise<object>} - Inferred relationships with confidence scores
   */
  async inferRelationships(entityType, entityId, context = {}) {
    try {
      let relationships = [];
      
      switch (entityType) {
        case 'student':
          relationships = await this.inferStudentRelationships(entityId, context);
          break;
        case 'teacher':
          relationships = await this.inferTeacherRelationships(entityId, context);
          break;
        case 'class':
          relationships = await this.inferClassRelationships(entityId, context);
          break;
        case 'parent':
          relationships = await this.inferParentRelationships(entityId, context);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Store inferred relationships as automation suggestions
      await this.storeRelationshipSuggestions(entityType, entityId, relationships);

      return {
        entityType,
        entityId,
        relationships,
        totalInferred: relationships.length,
        highConfidence: relationships.filter(r => r.confidence >= 0.8).length
      };
    } catch (error) {
      console.error(`Error inferring relationships for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Infer relationships for a student
   */
  async inferStudentRelationships(studentId, context) {
    const relationships = [];
    
    // Get student data
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        parent: true
      }
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    // 1. Student-Class relationship inference
    if (!student.classId) {
      const classSuggestion = await this.inferStudentClassRelationship(student, context);
      if (classSuggestion) {
        relationships.push(classSuggestion);
      }
    }

    // 2. Parent-Child relationship inference
    if (!student.parentId) {
      const parentSuggestions = await this.inferParentChildRelationships(student);
      relationships.push(...parentSuggestions);
    }

    // 3. Subject-Student relationships based on class
    if (student.classId) {
      const subjectRelationships = await this.inferStudentSubjectRelationships(student);
      relationships.push(...subjectRelationships);
    }

    return relationships;
  }

  /**
   * Infer relationships for a teacher
   */
  async inferTeacherRelationships(teacherId, context) {
    const relationships = [];
    
    // Get teacher data
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new Error(`Teacher not found: ${teacherId}`);
    }

    // 1. Teacher-Class relationships based on subject
    if (teacher.subject) {
      const classSuggestions = await this.inferTeacherClassRelationships(teacher);
      relationships.push(...classSuggestions);
    }

    // 2. Teacher-Subject relationship validation
    if (teacher.subject) {
      const subjectValidation = await this.validateTeacherSubjectRelationship(teacher);
      if (subjectValidation) {
        relationships.push(subjectValidation);
      }
    }

    return relationships;
  }

  /**
   * Infer relationships for a class
   */
  async inferClassRelationships(classId, context) {
    const relationships = [];
    
    // Get class data
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: true
      }
    });

    if (!classData) {
      throw new Error(`Class not found: ${classId}`);
    }

    // 1. Class-Subject relationships
    const subjectSuggestions = await this.inferClassSubjectRelationships(classData);
    relationships.push(...subjectSuggestions);

    // 2. Class-Teacher relationships based on subjects
    const teacherSuggestions = await this.inferClassTeacherRelationships(classData);
    relationships.push(...teacherSuggestions);

    return relationships;
  }

  /**
   * Infer relationships for a parent
   */
  async inferParentRelationships(parentId, context) {
    const relationships = [];
    
    // Get parent data
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        children: true
      }
    });

    if (!parent) {
      throw new Error(`Parent not found: ${parentId}`);
    }

    // 1. Find potential children based on surname
    const potentialChildren = await this.findPotentialChildrenForParent(parent);
    relationships.push(...potentialChildren);

    return relationships;
  }

  /**
   * Infer student-class relationship
   */
  async inferStudentClassRelationship(student, context) {
    const { age, grade } = context;
    
    const classes = await prisma.class.findMany({
      include: {
        students: true
      }
    });

    // Filter classes based on grade level and capacity
    const suitableClasses = classes.filter(cls => {
      const studentCount = cls.students.length;
      const maxCapacity = 30;
      const isGradeAppropriate = this.isGradeAppropriate(cls.name, grade || age);
      return isGradeAppropriate && studentCount < maxCapacity;
    });

    if (suitableClasses.length === 0) {
      return null;
    }

    // Sort by availability and grade appropriateness
    suitableClasses.sort((a, b) => {
      const aScore = this.calculateClassSuitabilityScore(a, student, grade || age);
      const bScore = this.calculateClassSuitabilityScore(b, student, grade || age);
      return bScore - aScore;
    });

    const bestMatch = suitableClasses[0];
    
    return {
      type: this.relationshipTypes.STUDENT_CLASS,
      sourceEntity: student.id,
      targetEntity: bestMatch.id,
      confidence: this.calculateClassSuitabilityScore(bestMatch, student, grade || age) / 100,
      reasoning: `Best match based on grade level and class capacity (${bestMatch.students.length}/30 students)`,
      data: {
        class: bestMatch,
        alternatives: suitableClasses.slice(1, 3),
        capacityInfo: {
          current: bestMatch.students.length,
          max: 30,
          available: 30 - bestMatch.students.length
        }
      }
    };
  }

  /**
   * Infer parent-child relationships based on surname
   */
  async inferParentChildRelationships(student) {
    const studentSurname = student.name.split(' ').pop().toLowerCase();
    
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT'
      }
    });

    const potentialParents = parents.filter(parent => {
      const parentSurname = parent.name.split(' ').pop().toLowerCase();
      return parentSurname === studentSurname;
    });

    return potentialParents.map(parent => ({
      type: this.relationshipTypes.PARENT_CHILD,
      sourceEntity: parent.id,
      targetEntity: student.id,
      confidence: 0.8, // High confidence for surname matches
      reasoning: `Surname match: "${studentSurname}"`,
      data: {
        parent,
        student,
        matchType: 'surname'
      }
    }));
  }

  /**
   * Infer student-subject relationships based on class
   */
  async inferStudentSubjectRelationships(student) {
    if (!student.classId) {
      return [];
    }

    const classData = await prisma.class.findUnique({
      where: { id: student.classId }
    });

    if (!classData || !classData.subjectIds || classData.subjectIds.length === 0) {
      return [];
    }

    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: classData.subjectIds
        }
      }
    });

    return subjects.map(subject => ({
      type: 'student_subject',
      sourceEntity: student.id,
      targetEntity: subject.id,
      confidence: 0.9, // High confidence for class-based subjects
      reasoning: `Subject "${subject.name}" is part of class "${classData.name}" curriculum`,
      data: {
        subject,
        class: classData
      }
    }));
  }

  /**
   * Infer teacher-class relationships based on subject
   */
  async inferTeacherClassRelationships(teacher) {
    if (!teacher.subject) {
      return [];
    }

    const subject = await prisma.subject.findFirst({
      where: { name: teacher.subject }
    });

    if (!subject) {
      return [];
    }

    const classes = await prisma.class.findMany({
      where: {
        subjectIds: {
          has: subject.id
        }
      },
      include: {
        students: true
      }
    });

    // Check if teacher is already assigned to these classes
    const currentClassIds = teacher.classIds || [];
    const unassignedClasses = classes.filter(cls => !currentClassIds.includes(cls.id));

    return unassignedClasses.map(classObj => ({
      type: this.relationshipTypes.TEACHER_CLASS,
      sourceEntity: teacher.id,
      targetEntity: classObj.id,
      confidence: 0.85, // High confidence for subject-based assignment
      reasoning: `Teacher specializes in "${teacher.subject}" which is taught in this class`,
      data: {
        teacher,
        class: classObj,
        subject,
        currentStudents: classObj.students.length
      }
    }));
  }

  /**
   * Validate teacher-subject relationship
   */
  async validateTeacherSubjectRelationship(teacher) {
    const subject = await prisma.subject.findFirst({
      where: { name: teacher.subject }
    });

    if (!subject) {
      return {
        type: this.relationshipTypes.TEACHER_SUBJECT,
        sourceEntity: teacher.id,
        targetEntity: null,
        confidence: 0.1, // Low confidence - subject doesn't exist
        reasoning: `Subject "${teacher.subject}" not found in database`,
        data: {
          teacher,
          subjectName: teacher.subject,
          suggestion: 'Create subject or update teacher specialization'
        }
      };
    }

    return {
      type: this.relationshipTypes.TEACHER_SUBJECT,
      sourceEntity: teacher.id,
      targetEntity: subject.id,
      confidence: 0.95, // Very high confidence - subject exists
      reasoning: `Valid subject specialization: "${teacher.subject}"`,
      data: {
        teacher,
        subject
      }
    };
  }

  /**
   * Infer class-subject relationships
   */
  async inferClassSubjectRelationships(classData) {
    const gradeLevel = this.extractGradeLevel(classData.name);
    const allSubjects = await prisma.subject.findMany();

    // Core subjects by grade level
    const coreSubjectsByGrade = {
      '1-3': ['Mathematics', 'English', 'Science', 'Art'],
      '4-6': ['Mathematics', 'English', 'Science', 'History', 'Geography'],
      '7-9': ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Computer Science'],
      '10-12': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History']
    };

    const coreSubjects = coreSubjectsByGrade[gradeLevel] || coreSubjectsByGrade['4-6'];
    const suggestedSubjects = allSubjects.filter(s => coreSubjects.includes(s.name));

    // Check which subjects are already assigned
    const currentSubjectIds = classData.subjectIds || [];
    const missingSubjects = suggestedSubjects.filter(s => !currentSubjectIds.includes(s.id));

    return missingSubjects.map(subject => ({
      type: this.relationshipTypes.CLASS_SUBJECT,
      sourceEntity: classData.id,
      targetEntity: subject.id,
      confidence: 0.8, // High confidence for curriculum-based suggestions
      reasoning: `Core subject for grade level ${gradeLevel}`,
      data: {
        class: classData,
        subject,
        gradeLevel,
        curriculumType: 'core'
      }
    }));
  }

  /**
   * Infer class-teacher relationships
   */
  async inferClassTeacherRelationships(classData) {
    if (!classData.subjectIds || classData.subjectIds.length === 0) {
      return [];
    }

    const relationships = [];
    
    for (const subjectId of classData.subjectIds) {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      });

      if (!subject) continue;

      const teachers = await prisma.user.findMany({
        where: {
          role: 'TEACHER',
          subject: subject.name
        }
      });

      // Find teachers not already assigned to this class
      const availableTeachers = teachers.filter(teacher => 
        !(teacher.classIds || []).includes(classData.id)
      );

      // Sort by current workload
      availableTeachers.sort((a, b) => 
        (a.classIds || []).length - (b.classIds || []).length
      );

      if (availableTeachers.length > 0) {
        const bestTeacher = availableTeachers[0];
        
        relationships.push({
          type: 'class_teacher',
          sourceEntity: classData.id,
          targetEntity: bestTeacher.id,
          confidence: 0.75, // Good confidence based on subject match and availability
          reasoning: `Teacher specializes in "${subject.name}" and has lowest workload`,
          data: {
            class: classData,
            teacher: bestTeacher,
            subject,
            currentWorkload: (bestTeacher.classIds || []).length,
            alternatives: availableTeachers.slice(1, 3)
          }
        });
      }
    }

    return relationships;
  }

  /**
   * Find potential children for a parent
   */
  async findPotentialChildrenForParent(parent) {
    const parentSurname = parent.name.split(' ').pop().toLowerCase();
    
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      }
    });

    const potentialChildren = students.filter(student => {
      const studentSurname = student.name.split(' ').pop().toLowerCase();
      return studentSurname === parentSurname && !parent.childrenIds?.includes(student.id);
    });

    return potentialChildren.map(student => ({
      type: this.relationshipTypes.PARENT_CHILD,
      sourceEntity: parent.id,
      targetEntity: student.id,
      confidence: 0.7, // Moderate confidence for surname matches
      reasoning: `Potential parent-child relationship based on surname "${parentSurname}"`,
      data: {
        parent,
        student,
        matchType: 'surname',
        currentChildren: parent.childrenIds?.length || 0
      }
    }));
  }

  /**
   * Store relationship suggestions as automation suggestions
   */
  async storeRelationshipSuggestions(entityType, entityId, relationships) {
    for (const relationship of relationships) {
      await prisma.automationSuggestion.create({
        data: {
          entityType,
          entityId,
          suggestionType: 'relationship_inference',
          suggestionData: relationship,
          confidenceScore: relationship.confidence,
          accepted: false
        }
      });
    }
  }

  /**
   * Apply suggested relationship
   */
  async applyRelationship(suggestionId) {
    const suggestion = await prisma.automationSuggestion.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion) {
      throw new Error(`Suggestion not found: ${suggestionId}`);
    }

    const { suggestionData } = suggestion;
    let result;

    try {
      switch (suggestionData.type) {
        case this.relationshipTypes.STUDENT_CLASS:
          result = await this.applyStudentClassRelationship(suggestionData);
          break;
        case this.relationshipTypes.PARENT_CHILD:
          result = await this.applyParentChildRelationship(suggestionData);
          break;
        case this.relationshipTypes.TEACHER_CLASS:
          result = await this.applyTeacherClassRelationship(suggestionData);
          break;
        case this.relationshipTypes.CLASS_SUBJECT:
          result = await this.applyClassSubjectRelationship(suggestionData);
          break;
        default:
          throw new Error(`Unknown relationship type: ${suggestionData.type}`);
      }

      // Mark suggestion as accepted
      await prisma.automationSuggestion.update({
        where: { id: suggestionId },
        data: {
          accepted: true,
          appliedAt: new Date()
        }
      });

      return {
        success: true,
        result,
        relationship: suggestionData
      };
    } catch (error) {
      throw new Error(`Failed to apply relationship: ${error.message}`);
    }
  }

  /**
   * Apply student-class relationship
   */
  async applyStudentClassRelationship(relationshipData) {
    const { sourceEntity: studentId, targetEntity: classId } = relationshipData;
    
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { classId }
    });

    return {
      type: 'student_class_assigned',
      student: updatedStudent,
      classId
    };
  }

  /**
   * Apply parent-child relationship
   */
  async applyParentChildRelationship(relationshipData) {
    const { sourceEntity: parentId, targetEntity: studentId } = relationshipData;
    
    // Add student to parent's children
    const parent = await prisma.user.findUnique({
      where: { id: parentId }
    });

    const updatedParent = await prisma.user.update({
      where: { id: parentId },
      data: {
        childrenIds: [...(parent.childrenIds || []), studentId]
      }
    });

    // Set parent on student
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { parentId }
    });

    return {
      type: 'parent_child_assigned',
      parent: updatedParent,
      student: updatedStudent
    };
  }

  /**
   * Apply teacher-class relationship
   */
  async applyTeacherClassRelationship(relationshipData) {
    const { sourceEntity: teacherId, targetEntity: classId } = relationshipData;
    
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        classIds: [...(teacher.classIds || []), classId]
      }
    });

    return {
      type: 'teacher_class_assigned',
      teacher: updatedTeacher,
      classId
    };
  }

  /**
   * Apply class-subject relationship
   */
  async applyClassSubjectRelationship(relationshipData) {
    const { sourceEntity: classId, targetEntity: subjectId } = relationshipData;
    
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        subjectIds: [...(classData.subjectIds || []), subjectId]
      }
    });

    return {
      type: 'class_subject_assigned',
      class: updatedClass,
      subjectId
    };
  }

  /**
   * Get relationship suggestions for an entity
   */
  async getRelationshipSuggestions(entityType, entityId) {
    return await prisma.automationSuggestion.findMany({
      where: {
        entityType,
        entityId,
        suggestionType: 'relationship_inference',
        accepted: false
      },
      orderBy: {
        confidenceScore: 'desc'
      }
    });
  }

  /**
   * Get all relationship suggestions
   */
  async getAllRelationshipSuggestions(filters = {}) {
    const { entityType, minConfidence = 0.5, limit = 100 } = filters;
    
    const where = {
      suggestionType: 'relationship_inference',
      accepted: false,
      confidenceScore: {
        gte: minConfidence
      }
    };
    
    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.automationSuggestion.findMany({
      where,
      orderBy: {
        confidenceScore: 'desc'
      },
      take: limit
    });
  }

  /**
   * Helper function to calculate class suitability score
   */
  calculateClassSuitabilityScore(classObj, student, gradeOrAge) {
    let score = 50; // Base score
    
    // Grade appropriateness (40 points)
    if (this.isGradeAppropriate(classObj.name, gradeOrAge)) {
      score += 40;
    }
    
    // Capacity availability (30 points)
    const availableSpace = 30 - classObj.students.length;
    score += Math.min(30, (availableSpace / 30) * 30);
    
    // Class size preference (20 points)
    if (classObj.students.length < 25) {
      score += 20;
    } else if (classObj.students.length < 28) {
      score += 10;
    }
    
    // Subject diversity (10 points)
    if (classObj.subjectIds && classObj.subjectIds.length >= 3) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Helper function to check if class is appropriate for grade
   */
  isGradeAppropriate(className, gradeOrAge) {
    const classGrade = className.match(/Grade\s*(\d+)/i);
    if (classGrade) {
      const classGradeNum = parseInt(classGrade[1]);
      const studentGrade = typeof gradeOrAge === 'number' && gradeOrAge > 10 
        ? gradeOrAge - 6
        : gradeOrAge;
      
      return Math.abs(classGradeNum - studentGrade) <= 1;
    }
    return true;
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
    return '4-6';
  }
}

export default new RelationshipEngineService();