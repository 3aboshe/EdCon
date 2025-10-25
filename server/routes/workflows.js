import express from 'express';
import { prisma } from '../config/db.js';
import workflowAutomation from '../services/workflowAutomation.js';
import relationshipEngine from '../services/relationshipEngine.js';

const router = express.Router();

/**
 * Execute a workflow
 * POST /api/workflows/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const { workflowType, triggerData, createdBy } = req.body;
    
    if (!workflowType || !triggerData) {
      return res.status(400).json({ 
        message: 'Workflow type and trigger data are required' 
      });
    }

    console.log(`Executing workflow: ${workflowType} with data:`, triggerData);
    
    const result = await workflowAutomation.executeWorkflow(
      workflowType, 
      triggerData, 
      createdBy
    );
    
    res.json({
      success: true,
      workflow: result
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ 
      message: 'Workflow execution failed', 
      error: error.message 
    });
  }
});

/**
 * Get workflow status
 * GET /api/workflows/:id/status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const workflowId = parseInt(id);
    
    if (isNaN(workflowId)) {
      return res.status(400).json({ message: 'Invalid workflow ID' });
    }
    
    const status = await workflowAutomation.getWorkflowStatus(workflowId);
    
    if (!status) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.json({
      success: true,
      workflow: status
    });
  } catch (error) {
    console.error('Get workflow status error:', error);
    res.status(500).json({ 
      message: 'Failed to get workflow status', 
      error: error.message 
    });
  }
});

/**
 * Get all workflows
 * GET /api/workflows
 */
router.get('/', async (req, res) => {
  try {
    const { workflowType, status, limit } = req.query;
    
    const filters = {};
    if (workflowType) filters.workflowType = workflowType;
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    
    const workflows = await workflowAutomation.getAllWorkflows(filters);
    
    res.json({
      success: true,
      workflows,
      total: workflows.length
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ 
      message: 'Failed to get workflows', 
      error: error.message 
    });
  }
});

/**
 * Infer relationships for an entity
 * POST /api/workflows/infer-relationships
 */
router.post('/infer-relationships', async (req, res) => {
  try {
    const { entityType, entityId, context } = req.body;
    
    if (!entityType || !entityId) {
      return res.status(400).json({ 
        message: 'Entity type and entity ID are required' 
      });
    }
    
    console.log(`Inferring relationships for ${entityType}: ${entityId}`);
    
    const relationships = await relationshipEngine.inferRelationships(
      entityType, 
      entityId, 
      context
    );
    
    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Relationship inference error:', error);
    res.status(500).json({ 
      message: 'Relationship inference failed', 
      error: error.message 
    });
  }
});

/**
 * Get relationship suggestions for an entity
 * GET /api/workflows/relationship-suggestions/:entityType/:entityId
 */
router.get('/relationship-suggestions/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const suggestions = await relationshipEngine.getRelationshipSuggestions(
      entityType, 
      entityId
    );
    
    res.json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Get relationship suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to get relationship suggestions', 
      error: error.message 
    });
  }
});

/**
 * Get all relationship suggestions
 * GET /api/workflows/relationship-suggestions
 */
router.get('/relationship-suggestions', async (req, res) => {
  try {
    const { entityType, minConfidence, limit } = req.query;
    
    const filters = {};
    if (entityType) filters.entityType = entityType;
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence);
    if (limit) filters.limit = parseInt(limit);
    
    const suggestions = await relationshipEngine.getAllRelationshipSuggestions(filters);
    
    res.json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Get all relationship suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to get relationship suggestions', 
      error: error.message 
    });
  }
});

/**
 * Apply a suggested relationship
 * POST /api/workflows/apply-relationship
 */
router.post('/apply-relationship', async (req, res) => {
  try {
    const { suggestionId } = req.body;
    
    if (!suggestionId) {
      return res.status(400).json({ 
        message: 'Suggestion ID is required' 
      });
    }
    
    const result = await relationshipEngine.applyRelationship(suggestionId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Apply relationship error:', error);
    res.status(500).json({ 
      message: 'Failed to apply relationship', 
      error: error.message 
    });
  }
});

/**
 * Get workflow types
 * GET /api/workflows/types
 */
router.get('/types', async (req, res) => {
  try {
    const workflowTypes = {
      STUDENT_CREATION: 'student_creation',
      TEACHER_ASSIGNMENT: 'teacher_assignment',
      CLASS_CONFIGURATION: 'class_configuration'
    };
    
    res.json({
      success: true,
      workflowTypes
    });
  } catch (error) {
    console.error('Get workflow types error:', error);
    res.status(500).json({ 
      message: 'Failed to get workflow types', 
      error: error.message 
    });
  }
});

/**
 * Get relationship types
 * GET /api/workflows/relationship-types
 */
router.get('/relationship-types', async (req, res) => {
  try {
    const relationshipTypes = {
      STUDENT_CLASS: 'student_class',
      TEACHER_CLASS: 'teacher_class',
      PARENT_CHILD: 'parent_child',
      CLASS_SUBJECT: 'class_subject',
      TEACHER_SUBJECT: 'teacher_subject'
    };
    
    res.json({
      success: true,
      relationshipTypes
    });
  } catch (error) {
    console.error('Get relationship types error:', error);
    res.status(500).json({ 
      message: 'Failed to get relationship types', 
      error: error.message 
    });
  }
});

/**
 * Get automation suggestions
 * GET /api/workflows/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { entityType, suggestionType, accepted, limit } = req.query;
    
    const where = {};
    if (entityType) where.entityType = entityType;
    if (suggestionType) where.suggestionType = suggestionType;
    if (accepted !== undefined) where.accepted = accepted === 'true';
    
    const suggestions = await prisma.automationSuggestion.findMany({
      where,
      orderBy: {
        confidenceScore: 'desc'
      },
      take: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to get suggestions', 
      error: error.message 
    });
  }
});

/**
 * Accept or reject a suggestion
 * PUT /api/workflows/suggestions/:id
 */
router.put('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, appliedData } = req.body;
    
    if (accepted === undefined) {
      return res.status(400).json({ 
        message: 'Accepted status is required' 
      });
    }
    
    const suggestionId = parseInt(id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: 'Invalid suggestion ID' });
    }
    
    const updateData = {
      accepted,
      appliedAt: accepted ? new Date() : null
    };
    
    if (appliedData) {
      updateData.suggestionData = appliedData;
    }
    
    const suggestion = await prisma.automationSuggestion.update({
      where: { id: suggestionId },
      data: updateData
    });
    
    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Update suggestion error:', error);
    res.status(500).json({ 
      message: 'Failed to update suggestion', 
      error: error.message 
    });
  }
});

/**
 * Get learned patterns
 * GET /api/workflows/patterns
 */
router.get('/patterns', async (req, res) => {
  try {
    const { patternType, minConfidence, limit } = req.query;
    
    const where = {};
    if (patternType) where.patternType = patternType;
    if (minConfidence) where.confidenceScore = { gte: parseFloat(minConfidence) };
    
    const patterns = await prisma.learnedPattern.findMany({
      where,
      orderBy: {
        confidenceScore: 'desc'
      },
      take: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      patterns,
      total: patterns.length
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ 
      message: 'Failed to get patterns', 
      error: error.message 
    });
  }
});

/**
 * Get bulk operations
 * GET /api/workflows/bulk-operations
 */
router.get('/bulk-operations', async (req, res) => {
  try {
    const { operationType, status, createdBy, limit } = req.query;
    
    const where = {};
    if (operationType) where.operationType = operationType;
    if (status) where.status = status;
    if (createdBy) where.createdBy = createdBy;
    
    const operations = await prisma.bulkOperation.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      operations,
      total: operations.length
    });
  } catch (error) {
    console.error('Get bulk operations error:', error);
    res.status(500).json({ 
      message: 'Failed to get bulk operations', 
      error: error.message 
    });
  }
});

/**
 * Create bulk operation
 * POST /api/workflows/bulk-operations
 */
router.post('/bulk-operations', async (req, res) => {
  try {
    const { 
      operationType, 
      entityType, 
      totalRecords, 
      operationData, 
      createdBy 
    } = req.body;
    
    if (!operationType || !entityType || !totalRecords) {
      return res.status(400).json({ 
        message: 'Operation type, entity type, and total records are required' 
      });
    }
    
    const operation = await prisma.bulkOperation.create({
      data: {
        operationType,
        entityType,
        totalRecords,
        operationData,
        createdBy,
        status: 'pending'
      }
    });
    
    res.json({
      success: true,
      operation
    });
  } catch (error) {
    console.error('Create bulk operation error:', error);
    res.status(500).json({ 
      message: 'Failed to create bulk operation', 
      error: error.message 
    });
  }
});

/**
 * Update bulk operation status
 * PUT /api/workflows/bulk-operations/:id
 */
router.put('/bulk-operations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, successfulRecords, failedRecords, resultData } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        message: 'Status is required' 
      });
    }
    
    const operationId = parseInt(id);
    if (isNaN(operationId)) {
      return res.status(400).json({ message: 'Invalid operation ID' });
    }
    
    const updateData = {
      status,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : null
    };
    
    if (successfulRecords !== undefined) {
      updateData.successfulRecords = successfulRecords;
    }
    
    if (failedRecords !== undefined) {
      updateData.failedRecords = failedRecords;
    }
    
    if (resultData) {
      updateData.operationData = resultData;
    }
    
    const operation = await prisma.bulkOperation.update({
      where: { id: operationId },
      data: updateData
    });
    
    res.json({
      success: true,
      operation
    });
  } catch (error) {
    console.error('Update bulk operation error:', error);
    res.status(500).json({ 
      message: 'Failed to update bulk operation', 
      error: error.message 
    });
  }
});

export default router;