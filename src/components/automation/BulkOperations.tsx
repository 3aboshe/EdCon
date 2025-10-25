import React, { useState, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BulkOperation, BulkImportResult, DataMapping } from '../../types';
import apiService from '../../services/apiService';

interface BulkOperationsProps {
  onOperationComplete?: (result: BulkImportResult) => void;
  onCancel?: () => void;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  onOperationComplete,
  onCancel
}) => {
  const [mode, setMode] = useState<'upload' | 'mapping' | 'processing' | 'review'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [dataMapping, setDataMapping] = useState<DataMapping[]>([]);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: Array<{ row: number; field: string; message: string }>;
    warnings: string[];
  }>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operation, setOperation] = useState<BulkOperation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['csv', 'xlsx', 'xls'];
  const commonFields = {
    student: ['name', 'age', 'grade', 'classId', 'parentId'],
    teacher: ['name', 'subject', 'email', 'classIds'],
    parent: ['name', 'email', 'childrenIds'],
    class: ['name', 'subjectIds', 'maxCapacity', 'roomNumber']
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const fileName = uploadedFile.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (!supportedFormats.includes(fileExtension || '')) {
      setValidation({
        isValid: false,
        errors: [{ row: 0, field: 'file', message: `Unsupported file format: ${fileExtension}. Supported formats: ${supportedFormats.join(', ')}` }],
        warnings: []
      });
      return;
    }

    setFile(uploadedFile);
    setMode('mapping');
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsedData: any[] = [];

          if (file.name.toLowerCase().endsWith('.csv')) {
            parsedData = parseCSV(content);
          } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            // For Excel files, we'd need a library like xlsx
            // For now, we'll show an error
            setValidation({
              isValid: false,
              errors: [{ row: 0, field: 'file', message: 'Excel file parsing requires additional library. Please use CSV format.' }],
              warnings: []
            });
            reject(new Error('Excel parsing not implemented'));
            return;
          } else {
            setValidation({
              isValid: false,
              errors: [{ row: 0, field: 'file', message: 'Unsupported file format. Please use CSV or Excel format.' }],
              warnings: []
            });
            reject(new Error('Unsupported file format'));
            return;
          }

          setDataPreview(parsedData.slice(0, 10)); // Show first 10 rows
          setValidation({
            isValid: true,
            errors: [],
            warnings: parsedData.length > 1000 ? ['Large file detected. Processing may take longer than usual.'] : []
          });
          resolve(parsedData);
        } catch (error) {
          setValidation({
            isValid: false,
            errors: [{ row: 0, field: 'file', message: `Error parsing file: ${(error as Error).message}` }],
            warnings: []
          });
          reject(error);
        }
      };

      reader.onerror = () => {
        setValidation({
          isValid: false,
          errors: [{ row: 0, field: 'file', message: 'Error reading file' }],
          warnings: []
        });
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        // Skip malformed rows
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      data.push(row);
    }

    return data;
  };

  const detectColumns = (data: any[]): string[] => {
    if (data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow);
  };

  const generateIntelligentMapping = (detectedColumns: string[], entityType: string): DataMapping[] => {
    const mappings: DataMapping[] = [];
    const entityFields = commonFields[entityType as keyof typeof commonFields] || [];

    for (const column of detectedColumns) {
      // Find best matching field
      let bestMatch = '';
      let bestScore = 0;

      for (const field of entityFields) {
        const score = calculateFieldMatchScore(column, field);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = field;
        }
      }

      if (bestScore > 0.3) {
        mappings.push({
          sourceField: column,
          targetField: bestMatch,
          confidence: bestScore,
          transformation: suggestTransformation(column, bestMatch)
        });
      }
    }

    return mappings;
  };

  const calculateFieldMatchScore = (sourceColumn: string, targetField: string): number => {
    const source = sourceColumn.toLowerCase();
    const target = targetField.toLowerCase();

    // Exact match
    if (source === target) return 1.0;

    // Contains match
    if (source.includes(target) || target.includes(source)) return 0.8;

    // Partial match
    const sourceWords = source.split(/[_\s-]/).filter(Boolean);
    const targetWords = target.split(/[_\s-]/).filter(Boolean);
    const commonWords = sourceWords.filter(word => targetWords.includes(word));

    return commonWords.length / Math.max(sourceWords.length, targetWords.length) * 0.5;
  };

  const suggestTransformation = (sourceColumn: string, targetField: string): string => {
    const source = sourceColumn.toLowerCase();
    const target = targetField.toLowerCase();

    // Common transformations
    const transformations: { [key: string]: string } = {
      'name': 'trim',
      'email': 'lowercase',
      'age': 'number',
      'grade': 'number',
      'classid': 'trim',
      'parentid': 'trim',
      'subjectids': 'split',
      'maxcapacity': 'number'
    };

    return transformations[target] || 'none';
  };

  const handleMappingUpdate = (index: number, mapping: DataMapping) => {
    const newMappings = [...dataMapping];
    newMappings[index] = mapping;
    setDataMapping(newMappings);
  };

  const handleAutoMapping = () => {
    const detectedColumns = detectColumns(dataPreview);
    const entityType = 'student'; // Default to student, could be made dynamic

    const intelligentMappings = generateIntelligentMapping(detectedColumns, entityType);

    if (intelligentMappings.length > 0) {
      setDataMapping(intelligentMappings);
      setValidation({
        isValid: true,
        errors: [],
        warnings: [`Generated ${intelligentMappings.length} intelligent field mappings`]
      });
    } else {
      setValidation({
        isValid: false,
        errors: [{ row: 0, field: 'mapping', message: 'Could not generate intelligent mappings for detected columns' }],
        warnings: []
      });
    }
  };

  const validateMapping = (): boolean => {
    const requiredFields = ['name'];
    const mappedFields = dataMapping.map(m => m.targetField);

    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      setValidation({
        isValid: false,
        errors: missingRequired.map(field => ({
          row: 0,
          field,
          message: `Required field "${field}" is not mapped`
        })),
        warnings: []
      });
      return false;
    }

    setValidation({
      isValid: true,
      errors: [],
      warnings: []
    });
    return true;
  };

  const startProcessing = async () => {
    if (!validateMapping()) return;

    setProcessing(true);
    setProgress(0);

    try {
      // Create bulk operation record
      const operationResponse = await fetch(`https://edcon-production.up.railway.app/api/workflows/bulk-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType: 'import',
          entityType: 'student', // Default to student
          totalRecords: dataPreview.length,
          operationData: {
            dataPreview,
            mapping: dataMapping
          }
        })
      });

      const operationData = await operationResponse.json();

      if (operationData.success) {
        setOperation(operationData.operation);

        // Process data in chunks
        const chunkSize = 50;
        const chunks = [];

        for (let i = 0; i < dataPreview.length; i += chunkSize) {
          chunks.push(dataPreview.slice(i, i + chunkSize));
        }

        let successfulRecords = 0;
        let failedRecords = 0;
        const errors: Array<{ row: number; field: string; message: string }> = [];

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
          const chunk = chunks[chunkIndex];
          const processedChunk = [];

          for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
            const row = chunk[rowIndex];
            const processedRow = { ...row };

            // Apply transformations
            for (const mapping of dataMapping) {
              const sourceValue = row[mapping.sourceField];
              if (sourceValue) {
                switch (mapping.transformation) {
                  case 'trim':
                    processedRow[mapping.targetField] = sourceValue.toString().trim();
                    break;
                  case 'lowercase':
                    processedRow[mapping.targetField] = sourceValue.toString().toLowerCase();
                    break;
                  case 'number':
                    const numValue = parseFloat(sourceValue);
                    processedRow[mapping.targetField] = isNaN(numValue) ? '' : numValue;
                    break;
                  case 'split':
                    processedRow[mapping.targetField] = sourceValue.toString().split(',').map(s => s.trim()).filter(Boolean);
                    break;
                }
              }
            }

            processedChunk.push(processedRow);
          }

          // Send chunk for processing
          const chunkResponse = await fetch(`https://edcon-production.up.railway.app/api/workflows/bulk-operations/${operationData.operation?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationData: {
                chunk: processedChunk,
                chunkIndex,
                totalChunks: chunks.length
              }
            })
          });

          const chunkResult = await chunkResponse.json();

          if (chunkResult.success) {
            successfulRecords += processedChunk.length;
            setProgress(Math.round(((chunkIndex + 1) / chunks.length) * 100));
          } else {
            failedRecords += chunk.length;
            errors.push({
              row: chunkIndex * chunkSize,
              field: 'chunk',
              message: 'Failed to process chunk'
            });
          }
        }

        // Update operation status
        await fetch(`https://edcon-production.up.railway.app/api/workflows/bulk-operations/${operationData.operation?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationData: {
              successfulRecords,
              failedRecords,
              errors,
              status: 'completed'
            }
          })
        });

        const result: BulkImportResult = {
          totalRecords: dataPreview.length,
          successfulRecords,
          failedRecords,
          errors,
          operationId: operationData.operation?.id
        };

        onOperationComplete?.(result);
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setValidation({
        isValid: false,
        errors: [{ row: 0, field: 'processing', message: `Operation failed: ${(error as Error).message}` }],
        warnings: []
      });
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const renderUploadMode = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload File (CSV or Excel)
        </label>
        <div className="flex items-center justify-center w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            {processing ? <LoadingSpinner size="sm" /> : 'Choose File'}
          </Button>
        </div>
      </div>

      {file && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">File Selected</h4>
          <p className="text-sm text-gray-600">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}
    </div>
  );

  const renderMappingMode = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Mapping</h3>
        <p className="text-sm text-gray-600 mb-4">
          Map your file columns to appropriate database fields. We've detected {detectColumns(dataPreview).length} columns.
        </p>
      </div>

      {dataPreview.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Data Preview</h4>
          <p className="text-sm text-gray-600">
            Showing first {Math.min(dataPreview.length, 10)} rows
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h4 className="font-medium text-gray-900 mb-2">Detected Columns</h4>
          <div className="space-y-2">
            {detectColumns(dataPreview).map((column, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded border">
                <code className="text-sm">{column}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-medium text-gray-900 mb-2">Field Mapping</h4>
          <div className="space-y-2">
            {dataMapping.map((mapping, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 items-center p-2 bg-white rounded border">
                <div>
                  <label className="text-sm font-medium text-gray-700">Source Field</label>
                  <Input
                    value={mapping.sourceField}
                    onChange={(e) => handleMappingUpdate(index, { ...mapping, sourceField: e.target.value })}
                    placeholder="Column name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Field</label>
                  <Input
                    value={mapping.targetField}
                    onChange={(e) => handleMappingUpdate(index, { ...mapping, targetField: e.target.value })}
                    placeholder="Database field"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Confidence</label>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">
                      {mapping.confidence.toFixed(2)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={mapping.confidence}
                      onChange={(e) => handleMappingUpdate(index, { ...mapping, confidence: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMappings = dataMapping.filter((_, i) => i !== index);
                    setDataMapping(newMappings);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button
            variant="outline"
            onClick={handleAutoMapping}
            disabled={dataPreview.length === 0}
          >
            Auto-Map Fields
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setMode('upload')}
        >
          Back
        </Button>
        <Button
          onClick={startProcessing}
          disabled={!validation.isValid || dataMapping.length === 0}
        >
          Start Import
        </Button>
      </div>
    </div>
  );

  const renderProcessingMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h3 className="text-lg font-medium text-gray-900 mt-4">Processing Data</h3>
        <p className="text-sm text-gray-600">
          Please wait while we process your data. This may take a few minutes.
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {progress}% Complete - Processing chunk {Math.ceil(progress / 25)} of {Math.ceil(dataPreview.length / 25)}
        </p>
      </div>
    </div>
  );

  const renderReviewMode = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Complete</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your data has been processed. Please review results below.
        </p>
      </div>

      {operation && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900 mb-2">Operation Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Total Records:</strong> {operation.totalRecords}
            </div>
            <div>
              <strong>Successful:</strong> {operation.successfulRecords}
            </div>
            <div>
              <strong>Failed:</strong> {operation.failedRecords}
            </div>
            <div>
              <strong>Status:</strong> {operation.status}
            </div>
          </div>

          {operation && 'errors' in operation && (operation as any).errors && (operation as any).errors.length > 0 && (
            <div className="col-span-2 mt-4">
              <strong>Errors:</strong>
              <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2 text-sm">
                {(operation as any).errors.slice(0, 10).map((error: any, index: number) => (
                  <div key={index} className="mb-1">
                    <strong>Row {error.row}:</strong> {error.field} - {error.message}
                  </div>
                ))}
                {(operation as any).errors.length > 10 && (
                  <div className="text-sm text-gray-500 mt-2">
                    ... and {(operation as any).errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setMode('upload');
            setFile(null);
            setDataPreview([]);
            setDataMapping([]);
            setValidation({ isValid: true, errors: [], warnings: [] });
            setOperation(null);
          }}
        >
          New Import
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Operations
          </h2>
          <div className="flex space-x-2">
            <Button
              variant={mode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('upload')}
            >
              Upload
            </Button>
            <Button
              variant={mode === 'mapping' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('mapping')}
              disabled={!file}
            >
              Mapping
            </Button>
          </div>
        </div>

        {validation.errors.length > 0 && (
          <Alert variant="error" className="mb-4">
            {validation.errors.map((error, index) => (
              <div key={index}>{error.field}: {error.message}</div>
            ))}
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert variant="warning" className="mb-4">
            {validation.warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </Alert>
        )}

        {mode === 'upload' && renderUploadMode()}
        {mode === 'mapping' && renderMappingMode()}
        {mode === 'processing' && renderProcessingMode()}
        {mode === 'review' && renderReviewMode()}
      </div>
    </Card>
  );
};

export default BulkOperations;