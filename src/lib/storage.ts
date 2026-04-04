import fs from 'fs';
import path from 'path';
import { KnowledgeItem } from './types';

const STORAGE_PATH = path.join(process.cwd(), 'knowledge.json');

export function readKnowledge(): KnowledgeItem[] {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading knowledge:', error);
    return [];
  }
}

export function writeKnowledge(items: KnowledgeItem[]) {
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing knowledge:', error);
  }
}

export function addItem(item: KnowledgeItem) {
  const items = readKnowledge();
  items.push(item);
  writeKnowledge(items);
}

export function deleteItem(id: string) {
  const items = readKnowledge();
  const filtered = items.filter(item => item.id !== id);
  writeKnowledge(filtered);
}

export function chunkText(text: string, maxWords: number = 300): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}
