/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES } from './flutterFiles';

export async function exportFlutterProjectZip(): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('classtrack_flutter');

  if (!root) {
    throw new Error('Failed to create ZIP folder');
  }

  // Populate all files
  for (const file of FLUTTER_PROJECT_FILES) {
    root.file(file.path, file.content);
  }

  // Generate ZIP blob
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  // Trigger browser download
  const link = document.createElement('a');
  link.href = url;
  link.download = 'classtrack_flutter_mobile_app.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
