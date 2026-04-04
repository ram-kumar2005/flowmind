import fs from 'fs';
import path from 'path';
import { KnowledgeItem } from './types';

function getStoragePath(email?: string) {
  if (!email) {
    return path.join(process.cwd(), 'knowledge.json');
  }
  // Sanitize email for filename
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(process.cwd(), `knowledge_${safeEmail}.json`);
}

export function readKnowledge(email?: string): KnowledgeItem[] {
  const storagePath = getStoragePath(email);
  try {
    if (!fs.existsSync(storagePath)) {
      return [];
    }
    const data = fs.readFileSync(storagePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading knowledge for ${email}:`, error);
    return [];
  }
}

export function writeKnowledge(items: KnowledgeItem[], email?: string) {
  const storagePath = getStoragePath(email);
  try {
    fs.writeFileSync(storagePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing knowledge for ${email}:`, error);
  }
}

export function addItem(item: KnowledgeItem, email?: string) {
  const items = readKnowledge(email);
  items.push(item);
  writeKnowledge(items, email);
}

export function deleteItem(id: string, email?: string) {
  const items = readKnowledge(email);
  const filtered = items.filter(item => item.id !== id);
  writeKnowledge(filtered, email);
}

export function chunkText(text: string, maxWords: number = 300): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}
