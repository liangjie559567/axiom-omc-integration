import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export class CommandAdapter {
  loadMarkdownCommand(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);
    return {
      name: path.basename(filePath, '.md'),
      description: data.description || '',
      disableModelInvocation: data['disable-model-invocation'] || false,
      handler: () => body
    };
  }
}
