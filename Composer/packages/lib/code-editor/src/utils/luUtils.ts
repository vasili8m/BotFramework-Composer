// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuEntity } from '@botframework-composer/types';
import formatMessage from 'format-message';

import { ToolbarLuEntityType } from '../lu/types';

import { MonacoEdit, MonacoPosition, MonacoRange } from './monacoTypes';

export const getEntityTypeDisplayName = (entityType: ToolbarLuEntityType) => {
  switch (entityType) {
    case 'ml':
      return formatMessage('Machine learned');
    case 'prebuilt':
      return formatMessage('Prebuilt');
  }
};

const findFirstMissingIndex = (arr: number[], start: number, end: number): number => {
  if (start > end) return end + 1;

  if (start + 1 !== arr[start]) return start;

  const mid = Math.floor(start + (end - start) / 2);

  if (arr[mid] === mid + 1) {
    return findFirstMissingIndex(arr, mid + 1, end);
  }

  return findFirstMissingIndex(arr, start, mid);
};

export const getDuplicateName = (name: string, allNames: readonly string[]) => {
  if (!name) {
    return '';
  }

  const getBestIndex = (origName: string) => {
    const pattern = `^${origName}(-[0-9]+)*$`;
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(pattern);
    const otherNames = allNames.filter((n) => regex.test(n));
    const indices: number[] = [];
    for (const otherName of otherNames) {
      try {
        const matched = otherName.match(regex);
        if (matched) {
          const { 1: otherIdxString } = matched;
          const otherIdx = parseInt(otherIdxString.slice(1));
          indices.push(otherIdx);
        }
      } catch {
        continue;
      }
    }

    if (!otherNames.length) {
      return;
    }

    if (!indices.length) {
      return 1;
    }

    indices.sort((a, b) => a - b);
    const maxIdx = Math.max(...indices);

    const firstAvailableIdx = findFirstMissingIndex(indices, 0, indices.length - 1);

    return firstAvailableIdx === -1 ? maxIdx + 1 : firstAvailableIdx + 1;
  };

  const cpIndex = name.lastIndexOf('-');
  const originalName = cpIndex === -1 ? name : name.substring(0, cpIndex);

  const bestIndex = getBestIndex(originalName);

  return bestIndex ? `${originalName}-${bestIndex}` : originalName;
};

const getLuText = (entityType: ToolbarLuEntityType, entity: string, entities: readonly string[] = []) => {
  const entityName = getDuplicateName(entity, entities);
  switch (entityType) {
    case 'ml':
      return `@ ml ${entityName}`;
    case 'prebuilt':
      return `@ prebuilt ${entityName}`;
  }
};

export const computeDefineLuEntityEdits = (
  entityType: ToolbarLuEntityType,
  entityName: string,
  editor: any,
  entities: readonly LuEntity[]
): { edits: MonacoEdit[]; selection?: MonacoRange } | undefined => {
  if (editor) {
    const position: MonacoPosition = editor.getPosition() ?? { lineNumber: 1, column: 1 };
    const selection: MonacoRange = editor.getSelection();
    const textSelected =
      selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn;

    const insertText = getLuText(
      entityType,
      entityName,
      entities.map((e) => e.Name)
    );
    const edits: MonacoEdit[] = [];

    edits.push({
      range:
        textSelected && selection
          ? {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            }
          : {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
      text: insertText,
      forceMoveMarkers: true,
    });

    return {
      edits,
      selection:
        entityType === 'ml'
          ? {
              startLineNumber: position.lineNumber,
              startColumn: position.column + 5,
              endLineNumber: position.lineNumber,
              endColumn: position.column + insertText.length,
            }
          : undefined,
    };
  }
};

export const computeInsertLuEntityEdits = (entityName: string, editor: any) => {
  if (editor) {
    const position: MonacoPosition = editor.getPosition() ?? { lineNumber: 1, column: 1 };
    const selection: MonacoRange = editor.getSelection();

    const selectedText = editor.getModel()?.getValueInRange(selection) ?? '';

    const insertText = selectedText ? `{${entityName} = ${selectedText}}` : `{${entityName}}`;
    const edits: MonacoEdit[] = [];

    edits.push({
      range:
        selectedText && selection
          ? {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            }
          : {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
      text: insertText,
      forceMoveMarkers: true,
    });

    return edits;
  }
};

export const isLineUtterance = (line?: string): boolean => {
  return !!line && /^-.*$/.test(line);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSelectionWithinBrackets = (lineContent?: string, selection?: any, selectedText?: string): boolean => {
  if (!lineContent || !selection || !selectedText) {
    return false;
  }

  // if selectedText contains an open or close bracket that is not escaped, return true
  for (let i = 0; i < selectedText.length; i++) {
    if (['{', '}'].includes(selectedText[i]) && selectedText[i - 1] !== '\\') {
      return true;
    }
  }

  const { startColumn, endColumn } = selection;

  const left = lineContent.slice(0, startColumn - 1);
  const right = lineContent.slice(endColumn - 1);

  for (let i = left.length - 1; i > -1; i--) {
    if (left[i] === '{' && left[i - 1] !== '\\') {
      // if left contains open bracket, check right for close bracket
      for (let j = 0; j < right.length; j++) {
        if (right[j] === '}' && right[j - 1] !== '\\') {
          return true;
        } else if (right[j] === '{') {
          return false;
        }
      }
      break;
    } else if (left[i] === '}') {
      return false;
    }
  }

  return false;
};
