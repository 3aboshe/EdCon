import { prisma } from '../config/db.js';

class IntelligentLinkingService {
  constructor() {
    this.linkingStrategies = {
      SURNAME_MATCHING: 'surname_matching',
      SEMANTIC_ANALYSIS: 'semantic_analysis',
      CONTEXTUAL_INFERENCE: 'contextual_inference',
      MACHINE_LEARNING: 'machine_learning'
    };
  }

  /**
   * Analyze and create intelligent links between entities
   * @param {string} sourceType - Type of source entity
   * @param {string} sourceId - ID of source entity
   * @param {string} targetType - Type of target entity
   * @param {object} context - Additional context for linking
   * @returns {Promise<object>} - Linking analysis and results
   */
  async analyzeAndCreateLinks(sourceType, sourceId, targetType, context = {}) {
    try {
      const linkingAnalysis = await this.performLinkingAnalysis(
        sourceType, 
        sourceId, 
        targetType, 
        context
      );

      const confidenceScore = this.calculateConfidenceScore(linkingAnalysis);
      
      // Store the linking suggestion
      await this.storeLinkingSuggestion({
        sourceType,
        sourceId,
        targetType,
        analysis: linkingAnalysis,
        confidenceScore,
        context
      });

      return {
        success: true,
        analysis: linkingAnalysis,
        confidenceScore,
        suggestions: linkingAnalysis.suggestions || [],
        reasoning: linkingAnalysis.reasoning
      };
    } catch (error) {
      console.error('Error in intelligent linking:', error);
      throw new Error(`Intelligent linking failed: ${error.message}`);
    }
  }

  /**
   * Perform comprehensive linking analysis
   */
  async performLinkingAnalysis(sourceType, sourceId, targetType, context) {
    const analysis = {
      sourceType,
      sourceId,
      targetType,
      timestamp: new Date(),
      strategies: [],
      suggestions: [],
      reasoning: [],
      confidenceFactors: {}
    };

    // Get source entity data
    const sourceEntity = await this.getEntityData(sourceType, sourceId);
    if (!sourceEntity) {
      throw new Error(`Source entity not found: ${sourceType} ${sourceId}`);
    }

    // Strategy 1: Surname-based matching for parent-child relationships
    if (this.shouldApplySurnameStrategy(sourceType, targetType)) {
      const surnameAnalysis = await this.analyzeSurnameMatching(sourceEntity, targetType);
      analysis.strategies.push('surname_matching');
      analysis.suggestions.push(...surnameAnalysis.suggestions);
      analysis.reasoning.push(...surnameAnalysis.reasoning);
      Object.assign(analysis.confidenceFactors, surnameAnalysis.confidenceFactors);
    }

    // Strategy 2: Subject-based matching for teacher-class relationships
    if (this.shouldApplySubjectStrategy(sourceType, targetType)) {
      const subjectAnalysis = await this.analyzeSubjectMatching(sourceEntity, targetType);
      analysis.strategies.push('subject_matching');
      analysis.suggestions.push(...subjectAnalysis.suggestions);
      analysis.reasoning.push(...subjectAnalysis.reasoning);
      Object.assign(analysis.confidenceFactors, subjectAnalysis.confidenceFactors);
    }

    // Strategy 3: Grade-level matching for student-class relationships
    if (this.shouldApplyGradeStrategy(sourceType, targetType)) {
      const gradeAnalysis = await this.analyzeGradeMatching(sourceEntity, targetType);
      analysis.strategies.push('grade_matching');
      analysis.suggestions.push(...gradeAnalysis.suggestions);
      analysis.reasoning.push(...gradeAnalysis.reasoning);
      Object.assign(analysis.confidenceFactors, gradeAnalysis.confidenceFactors);
    }

    // Strategy 4: Capacity-based matching for class assignments
    if (this.shouldApplyCapacityStrategy(sourceType, targetType)) {
      const capacityAnalysis = await this.analyzeCapacityMatching(sourceEntity, targetType);
      analysis.strategies.push('capacity_matching');
      analysis.suggestions.push(...capacityAnalysis.suggestions);
      analysis.reasoning.push(...capacityAnalysis.reasoning);
      Object.assign(analysis.confidenceFactors, capacityAnalysis.confidenceFactors);
    }

    // Strategy 5: Semantic analysis for complex relationships
    if (this.shouldApplySemanticStrategy(sourceType, targetType)) {
      const semanticAnalysis = await this.performSemanticAnalysis(sourceEntity, targetType, context);
      analysis.strategies.push('semantic_analysis');
      analysis.suggestions.push(...semanticAnalysis.suggestions);
      analysis.reasoning.push(...semanticAnalysis.reasoning);
      Object.assign(analysis.confidenceFactors, semanticAnalysis.confidenceFactors);
    }

    return analysis;
  }

  /**
   * Check if surname matching strategy should be applied
   */
  shouldApplySurnameStrategy(sourceType, targetType) {
    return (
      (sourceType === 'parent' && targetType === 'student') ||
      (sourceType === 'student' && targetType === 'parent')
    );
  }

  /**
   * Check if subject matching strategy should be applied
   */
  shouldApplySubjectStrategy(sourceType, targetType) {
    return (
      (sourceType === 'teacher' && targetType === 'class') ||
      (sourceType === 'class' && targetType === 'teacher')
    );
  }

  /**
   * Check if grade matching strategy should be applied
   */
  shouldApplyGradeStrategy(sourceType, targetType) {
    return sourceType === 'student' && targetType === 'class';
  }

  /**
   * Check if capacity matching strategy should be applied
   */
  shouldApplyCapacityStrategy(sourceType, targetType) {
    return (
      (sourceType === 'teacher' && targetType === 'class') ||
      (sourceType === 'class' && targetType === 'teacher')
    );
  }

  /**
   * Check if semantic analysis should be applied
   */
  shouldApplySemanticStrategy(sourceType, targetType) {
    // Apply semantic analysis for complex or ambiguous relationships
    return (
      (sourceType === 'student' && targetType === 'class') ||
      (sourceType === 'class' && targetType === 'student') ||
      (sourceType === 'teacher' && targetType === 'class') ||
      (sourceType === 'class' && targetType === 'teacher')
    );
  }

  /**
   * Analyze surname-based matching
   */
  async analyzeSurnameMatching(sourceEntity, targetType) {
    const sourceSurname = this.extractSurname(sourceEntity.name);
    
    // Find potential matches based on surname
    const potentialTargets = await this.findEntitiesBySurname(targetType, sourceSurname);
    
    const suggestions = potentialTargets.map(target => ({
      entityId: target.id,
      entityType: targetType,
      confidence: this.calculateSurnameConfidence(sourceEntity, target),
      reasoning: `Surname match: "${sourceSurname}"`,
      data: {
        source: sourceEntity,
        target,
        matchType: 'surname',
        surname: sourceSurname
      }
    }));

    return {
      strategy: 'surname_matching',
      suggestions,
      reasoning: [`Found ${suggestions.length} potential ${targetType} matches with surname "${sourceSurname}"`],
      confidenceFactors: {
        surnameExactMatch: suggestions.filter(s => s.confidence > 0.8).length,
        surnamePartialMatch: suggestions.filter(s => s.confidence > 0.5 && s.confidence <= 0.8).length
      }
    };
  }

  /**
   * Analyze subject-based matching
   */
  async analyzeSubjectMatching(sourceEntity, targetType) {
    if (!sourceEntity.subject) {
      return {
        strategy: 'subject_matching',
        suggestions: [],
        reasoning: ['No subject specified for matching'],
        confidenceFactors: {}
      };
    }

    // Find entities that match the subject
    const matchingTargets = await this.findEntitiesBySubject(targetType, sourceEntity.subject);
    
    const suggestions = matchingTargets.map(target => ({
      entityId: target.id,
      entityType: targetType,
      confidence: this.calculateSubjectConfidence(sourceEntity, target),
      reasoning: `Subject match: "${sourceEntity.subject}"`,
      data: {
        source: sourceEntity,
        target,
        matchType: 'subject',
        subject: sourceEntity.subject
      }
    }));

    return {
      strategy: 'subject_matching',
      suggestions,
      reasoning: [`Found ${suggestions.length} ${targetType} matches for subject "${sourceEntity.subject}"`],
      confidenceFactors: {
        subjectExactMatch: suggestions.length,
        subjectRelevance: this.calculateSubjectRelevance(sourceEntity.subject)
      }
    };
  }

  /**
   * Analyze grade-level matching
   */
  async analyzeGradeMatching(sourceEntity, targetType) {
    const sourceGrade = this.extractGrade(sourceEntity);
    
    // Find appropriate classes based on grade
    const appropriateTargets = await this.findEntitiesByGrade(targetType, sourceGrade);
    
    const suggestions = appropriateTargets.map(target => ({
      entityId: target.id,
      entityType: targetType,
      confidence: this.calculateGradeConfidence(sourceEntity, target),
      reasoning: `Grade-appropriate class: ${sourceGrade}`,
      data: {
        source: sourceEntity,
        target,
        matchType: 'grade',
        grade: sourceGrade
      }
    }));

    return {
      strategy: 'grade_matching',
      suggestions,
      reasoning: [`Found ${suggestions.length} grade-appropriate classes for grade ${sourceGrade}`],
      confidenceFactors: {
        gradeAppropriateness: suggestions.length,
        gradeLevelMatch: this.calculateGradeLevelMatch(sourceGrade, target)
      }
    };
  }

  /**
   * Analyze capacity-based matching
   */
  async analyzeCapacityMatching(sourceEntity, targetType) {
    // Find entities with available capacity
    const availableTargets = await this.findEntitiesByCapacity(targetType);
    
    const suggestions = availableTargets.map(target => ({
      entityId: target.id,
      entityType: targetType,
      confidence: this.calculateCapacityConfidence(sourceEntity, target),
      reasoning: `Available capacity: ${target.currentCapacity || 0}/${target.maxCapacity || 30}`,
      data: {
        source: sourceEntity,
        target,
        matchType: 'capacity',
        capacityInfo: {
          current: target.currentCapacity || 0,
          max: target.maxCapacity || 30,
          available: (target.maxCapacity || 30) - (target.currentCapacity || 0)
        }
      }
    }));

    return {
      strategy: 'capacity_matching',
      suggestions,
      reasoning: [`Found ${suggestions.length} entities with available capacity`],
      confidenceFactors: {
        capacityAvailability: suggestions.length,
        workloadBalance: this.calculateWorkloadBalance(target)
      }
    };
  }

  /**
   * Perform semantic analysis for complex relationships
   */
  async performSemanticAnalysis(sourceEntity, targetType, context) {
    const semanticAnalysis = {
      strategy: 'semantic_analysis',
      suggestions: [],
      reasoning: [],
      confidenceFactors: {}
    };

    // Analyze entity attributes for semantic relationships
    const attributes = this.extractSemanticAttributes(sourceEntity);
    
    // Find semantically related entities
    const relatedEntities = await this.findSemanticallyRelatedEntities(targetType, attributes);
    
    for (const related of relatedEntities) {
      const confidence = this.calculateSemanticConfidence(sourceEntity, related, attributes);
      
      semanticAnalysis.suggestions.push({
        entityId: related.id,
        entityType: targetType,
        confidence,
        reasoning: `Semantic relationship: ${related.relationshipType}`,
        data: {
          source: sourceEntity,
          target: related,
          matchType: 'semantic',
          relationshipType: related.relationshipType,
          semanticScore: related.semanticScore
        }
      });

      semanticAnalysis.reasoning.push(
        `Semantic match: ${sourceEntity.name} -> ${related.name} (${related.relationshipType})`
      );
    }

    Object.assign(semanticAnalysis.confidenceFactors, {
      semanticSimilarity: semanticAnalysis.suggestions.length,
      contextRelevance: this.calculateContextRelevance(context)
    });

    return semanticAnalysis;
  }

  /**
   * Get entity data from database
   */
  async getEntityData(entityType, entityId) {
    try {
      switch (entityType) {
        case 'student':
          return await prisma.user.findUnique({
            where: { id: entityId, role: 'STUDENT' },
            include: { class: true, parent: true }
          });
        case 'teacher':
          return await prisma.user.findUnique({
            where: { id: entityId, role: 'TEACHER' },
            include: { classIds: true }
          });
        case 'parent':
          return await prisma.user.findUnique({
            where: { id: entityId, role: 'PARENT' },
            include: { children: true }
          });
        case 'class':
          return await prisma.class.findUnique({
            where: { id: entityId },
            include: { students: true }
          });
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      console.error('Error fetching entity data:', error);
      return null;
    }
  }

  /**
   * Find entities by surname
   */
  async findEntitiesBySurname(targetType, surname) {
    const surname = surname.toLowerCase();
    
    try {
      switch (targetType) {
        case 'parent':
          const parents = await prisma.user.findMany({
            where: { role: 'PARENT' }
          });
          
          return parents
            .filter(parent => this.extractSurname(parent.name).toLowerCase() === surname)
            .map(parent => ({
              id: parent.id,
              name: parent.name,
              relationshipType: 'potential_parent_child'
            }));
            
        case 'student':
          const students = await prisma.user.findMany({
            where: { role: 'STUDENT' }
          });
          
          return students
            .filter(student => this.extractSurname(student.name).toLowerCase() === surname)
            .map(student => ({
              id: student.id,
              name: student.name,
              relationshipType: 'potential_parent_child'
            }));
            
        default:
          return [];
      }
    } catch (error) {
      console.error('Error finding entities by surname:', error);
      return [];
    }
  }

  /**
   * Find entities by subject
   */
  async findEntitiesBySubject(targetType, subject) {
    try {
      switch (targetType) {
        case 'class':
          const classes = await prisma.class.findMany({
            where: {
              subjectIds: {
                has: this.getSubjectIdByName(subject)
              }
            },
            include: { students: true }
          });
          
          return classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            currentCapacity: cls.students?.length || 0,
            maxCapacity: 30,
            relationshipType: 'subject_match'
          }));
          
        case 'teacher':
          const teachers = await prisma.user.findMany({
            where: { 
              role: 'TEACHER',
              subject: subject
            }
          });
          
          return teachers.map(teacher => ({
            id: teacher.id,
            name: teacher.name,
            currentWorkload: teacher.classIds?.length || 0,
            relationshipType: 'subject_match'
          }));
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Error finding entities by subject:', error);
      return [];
    }
  }

  /**
   * Find entities by grade
   */
  async findEntitiesByGrade(targetType, grade) {
    try {
      if (targetType === 'class') {
        const classes = await prisma.class.findMany({
          include: { students: true }
        });
        
        // Filter classes appropriate for the grade level
        const appropriateClasses = classes.filter(cls => 
          this.isGradeAppropriateForClass(cls.name, grade)
        );
        
        return appropriateClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          currentCapacity: cls.students?.length || 0,
          maxCapacity: 30,
          relationshipType: 'grade_match'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error finding entities by grade:', error);
      return [];
    }
  }

  /**
   * Find entities by capacity
   */
  async findEntitiesByCapacity(targetType) {
    try {
      if (targetType === 'class') {
        const classes = await prisma.class.findMany({
          include: { students: true }
        });
        
        // Filter classes with available capacity
        const availableClasses = classes.filter(cls => 
          (cls.students?.length || 0) < 25 // Leave some buffer
        );
        
        return availableClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          currentCapacity: cls.students?.length || 0,
          maxCapacity: 30,
          relationshipType: 'capacity_available'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error finding entities by capacity:', error);
      return [];
    }
  }

  /**
   * Find semantically related entities
   */
  async findSemanticallyRelatedEntities(targetType, attributes) {
    // This is a simplified implementation - in a real system, this would use
    // more sophisticated NLP or knowledge graph techniques
    try {
      switch (targetType) {
        case 'class':
          const classes = await prisma.class.findMany({
            include: { students: true }
          });
          
          return classes
            .filter(cls => this.isSemanticallyRelated(cls, attributes))
            .map(cls => ({
              id: cls.id,
              name: cls.name,
              relationshipType: 'semantic_similarity',
              semanticScore: this.calculateSemanticScore(cls, attributes)
            }));
            
        default:
          return [];
      }
    } catch (error) {
      console.error('Error finding semantically related entities:', error);
      return [];
    }
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(analysis) {
    const weights = {
      surname_exact_match: 0.9,
      surname_partial_match: 0.6,
      subject_match: 0.8,
      grade_match: 0.7,
      capacity_match: 0.6,
      semantic_similarity: 0.5
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Calculate weighted score based on applied strategies
    for (const strategy of analysis.strategies) {
      const weight = weights[strategy] || 0.5;
      const factor = analysis.confidenceFactors[strategy] || 0;
      
      totalScore += weight * factor;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Helper methods for confidence calculation
   */
  calculateSurnameConfidence(source, target) {
    const sourceSurname = this.extractSurname(source.name);
    const targetSurname = this.extractSurname(target.name);
    
    if (sourceSurname === targetSurname) {
      return 0.9; // Exact match
    } else if (sourceSurname && targetSurname.includes(sourceSurname)) {
      return 0.7; // Partial match
    }
    
    return 0.3; // No match
  }

  calculateSubjectConfidence(source, target) {
    return source.subject === target.subject ? 0.8 : 0.4;
  }

  calculateGradeConfidence(source, target) {
    const sourceGrade = this.extractGrade(source);
    const targetGrade = this.extractGrade(target);
    
    if (Math.abs(sourceGrade - targetGrade) <= 1) {
      return 0.8; // Close grade match
    } else if (Math.abs(sourceGrade - targetGrade) <= 2) {
      return 0.6; // Reasonable grade match
    }
    
    return 0.3; // Poor grade match
  }

  calculateCapacityConfidence(source, target) {
    const availableCapacity = (target.maxCapacity || 30) - (target.currentCapacity || 0);
    const capacityRatio = availableCapacity / (target.maxCapacity || 30);
    
    return Math.min(0.8, capacityRatio * 2); // Max 0.8, higher for more availability
  }

  calculateSemanticConfidence(source, target, attributes) {
    // Simplified semantic scoring
    let score = 0.3;
    
    // Boost score based on attribute matches
    if (attributes.grade && target.name.includes(attributes.grade)) score += 0.2;
    if (attributes.subject && target.subjectIds?.includes(this.getSubjectIdByName(attributes.subject))) score += 0.2;
    
    return Math.min(0.8, score);
  }

  /**
   * Helper methods for data extraction
   */
  extractSurname(name) {
    return name.split(' ').pop() || '';
  }

  extractGrade(entity) {
    // Try to extract grade from class name or student data
    if (entity.class?.name) {
      const match = entity.class.name.match(/Grade\s*(\d+)/i);
      return match ? parseInt(match[1]) : null;
    }
    
    // For students, you might have age or grade field
    return entity.age ? Math.floor(entity.age / 6) + 1 : null;
  }

  extractSemanticAttributes(entity) {
    return {
      name: entity.name,
      grade: this.extractGrade(entity),
      subject: entity.subject,
      type: entity.role?.toLowerCase()
    };
  }

  isGradeAppropriateForClass(className, grade) {
    if (!grade) return true;
    
    const classGrade = this.extractGradeFromClass(className);
    if (!classGrade) return true;
    
    return Math.abs(classGrade - grade) <= 1;
  }

  extractGradeFromClass(className) {
    const match = className.match(/Grade\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  calculateSubjectRelevance(subject) {
    // Core subjects get higher relevance
    const coreSubjects = ['Mathematics', 'English', 'Science', 'History'];
    return coreSubjects.includes(subject) ? 1.0 : 0.5;
  }

  calculateGradeLevelMatch(sourceGrade, target) {
    const targetGrade = this.extractGradeFromClass(target.name);
    if (!targetGrade) return 0.5;
    
    return 1.0 - Math.abs(sourceGrade - targetGrade) / 12.0;
  }

  calculateWorkloadBalance(entity) {
    const idealWorkload = 4; // Ideal classes per teacher
    const currentWorkload = entity.currentWorkload || 0;
    
    if (currentWorkload === 0) return 1.0;
    if (currentWorkload <= idealWorkload) return 0.8;
    if (currentWorkload <= idealWorkload + 2) return 0.6;
    
    return 0.3; // Overloaded
  }

  calculateContextRelevance(context) {
    // Higher score for more specific context
    return Object.keys(context).length > 0 ? 0.2 : 0.0;
  }

  calculateSemanticScore(entity, attributes) {
    let score = 0.3; // Base semantic score
    
    // Boost for matching attributes
    if (attributes.grade && entity.name.includes(attributes.grade)) score += 0.3;
    if (attributes.subject && entity.subjectIds?.includes(this.getSubjectIdByName(attributes.subject))) score += 0.3;
    
    return Math.min(0.8, score);
  }

  isSemanticallyRelated(entity, attributes) {
    // Simplified semantic relatedness check
    return (
      (attributes.grade && entity.name.includes(attributes.grade)) ||
      (attributes.subject && entity.subjectIds?.includes(this.getSubjectIdByName(attributes.subject)))
    );
  }

  /**
   * Get subject ID by name
   */
  async getSubjectIdByName(subjectName) {
    try {
      const subject = await prisma.subject.findFirst({
        where: { name: subjectName }
      });
      return subject?.id || null;
    } catch (error) {
      console.error('Error finding subject by name:', error);
      return null;
    }
  }

  /**
   * Store linking suggestion in database
   */
  async storeLinkingSuggestion({ sourceType, sourceId, targetType, analysis, confidenceScore, context }) {
    try {
      await prisma.automationSuggestion.create({
        data: {
          entityType: sourceType,
          entityId: sourceId,
          suggestionType: 'intelligent_linking',
          suggestionData: {
            analysis,
            confidenceScore,
            targetType,
            context,
            strategies: analysis.strategies,
            suggestions: analysis.suggestions,
            reasoning: analysis.reasoning,
            timestamp: new Date()
          }
        },
        confidenceScore,
        accepted: false
      });
    } catch (error) {
      console.error('Error storing linking suggestion:', error);
    }
  }

  /**
   * Get linking suggestions for an entity
   */
  async getLinkingSuggestions(entityType, entityId, limit = 10) {
    try {
      const suggestions = await prisma.automationSuggestion.findMany({
        where: {
          entityType,
          entityId,
          suggestionType: 'intelligent_linking',
          accepted: false
        },
        orderBy: {
          confidenceScore: 'desc'
        },
        take: limit
      });

      return suggestions.map(suggestion => ({
        id: suggestion.id,
        ...suggestion.suggestionData,
        confidenceScore: suggestion.confidenceScore,
        createdAt: suggestion.createdAt
      }));
    } catch (error) {
      console.error('Error getting linking suggestions:', error);
      return [];
    }
  }

  /**
   * Accept a linking suggestion
   */
  async acceptLinkingSuggestion(suggestionId) {
    try {
      const suggestion = await prisma.automationSuggestion.findUnique({
        where: { id: suggestionId }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      const { analysis, targetType, context } = suggestion.suggestionData;

      // Apply the suggested link
      await this.applySuggestedLink(analysis);

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
        message: 'Linking suggestion applied successfully'
      };
    } catch (error) {
      console.error('Error accepting linking suggestion:', error);
      throw new Error(`Failed to accept suggestion: ${error.message}`);
    }
  }

  /**
   * Apply a suggested link
   */
  async applySuggestedLink(analysis) {
    // This would contain the actual logic to create relationships
    // based on the analysis results
    console.log('Applying suggested link:', analysis);
    
    // Implementation would depend on the specific link type
    // This is a placeholder for the actual linking logic
  }

  /**
   * Get relationship graph for entities
   */
  async getRelationshipGraph(entityIds = []) {
    try {
      const entities = await prisma.user.findMany({
        where: {
          id: { in: entityIds }
        },
        include: {
          class: true,
          parent: true,
          children: true
        }
      });

      const relationships = [];

      // Build relationship graph
      for (const entity of entities) {
        if (entity.classId) {
          relationships.push({
            from: entity.id,
            to: entity.classId,
            type: 'student_class',
            strength: 1.0
          });
        }

        if (entity.parentId) {
          relationships.push({
            from: entity.id,
            to: entity.parentId,
            type: 'student_parent',
            strength: 1.0
          });
        }

        if (entity.childrenIds) {
          for (const childId of entity.childrenIds) {
            relationships.push({
              from: entity.id,
              to: childId,
              type: 'parent_child',
              strength: 1.0
            });
          }
        }
      }

      return {
        entities,
        relationships,
        graphDensity: relationships.length / (entities.length || 1)
      };
    } catch (error) {
      console.error('Error getting relationship graph:', error);
      return {
        entities: [],
        relationships: [],
        graphDensity: 0
      };
    }
  }
}

export default new IntelligentLinkingService();