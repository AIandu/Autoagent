import { FileDiff } from '../types';

export function generateUnifiedDiff(filePath: string, oldContent: string, newContent: string): FileDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const diffLines: FileDiff['diffLines'] = [];
  let additions = 0;
  let deletions = 0;

  // Header
  diffLines.push({
    type: 'header',
    text: `--- a/${filePath}`,
  });
  diffLines.push({
    type: 'header',
    text: `+++ b/${filePath}`,
  });

  // Simple LCS / Myers diff approximation for clean unified code visualization
  let i = 0;
  let j = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diffLines.push({
        type: 'normal',
        text: ` ${oldLines[i]}`,
        oldLineNumber: oldLineNum++,
        newLineNumber: newLineNum++,
      });
      i++;
      j++;
    } else {
      // Lookahead window to match context
      let matchedOld = -1;
      let matchedNew = -1;
      const windowSize = 5;

      for (let w = 1; w <= windowSize; w++) {
        if (i + w < oldLines.length && oldLines[i + w] === (newLines[j] || '')) {
          matchedOld = i + w;
          break;
        }
        if (j + w < newLines.length && (oldLines[i] || '') === newLines[j + w]) {
          matchedNew = j + w;
          break;
        }
      }

      if (matchedNew !== -1) {
        // Additions
        while (j < matchedNew) {
          diffLines.push({
            type: 'add',
            text: `+${newLines[j]}`,
            newLineNumber: newLineNum++,
          });
          additions++;
          j++;
        }
      } else if (matchedOld !== -1) {
        // Deletions
        while (i < matchedOld) {
          diffLines.push({
            type: 'del',
            text: `-${oldLines[i]}`,
            oldLineNumber: oldLineNum++,
          });
          deletions++;
          i++;
        }
      } else {
        // Both changed or mismatch
        if (i < oldLines.length) {
          diffLines.push({
            type: 'del',
            text: `-${oldLines[i]}`,
            oldLineNumber: oldLineNum++,
          });
          deletions++;
          i++;
        }
        if (j < newLines.length) {
          diffLines.push({
            type: 'add',
            text: `+${newLines[j]}`,
            newLineNumber: newLineNum++,
          });
          additions++;
          j++;
        }
      }
    }
  }

  return {
    path: filePath,
    oldContent,
    newContent,
    diffLines,
    additions,
    deletions,
  };
}
