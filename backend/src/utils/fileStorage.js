import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

export class DataStore {
  constructor(fileName) {
    this.filePath = path.resolve(config.DATA_DIR, fileName);
  }

  async getAll() {
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async getById(id) {
    const items = await this.getAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async create(item) {
    const items = await this.getAll();
    items.push(item);
    await this._save(items);
    return item;
  }

  async update(id, patch) {
    const items = await this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch };
    await this._save(items);
    return items[idx];
  }

  async delete(id) {
    const items = await this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    await this._save(filtered);
    return true;
  }

  async _save(items) {
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
  }
}
