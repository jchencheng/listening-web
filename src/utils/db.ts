import type { Exercise, TestRecord } from '../types';

const DB_NAME = 'VideoExerciseDB';
const DB_VERSION = 2;
const STORE_NAME = 'exercises';
const TEST_RECORD_STORE = 'testRecords';

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(TEST_RECORD_STORE)) {
          const store = db.createObjectStore(TEST_RECORD_STORE, { keyPath: 'id' });
          store.createIndex('exerciseId', 'exerciseId', { unique: false });
          store.createIndex('completedAt', 'completedAt', { unique: false });
        }
      };
    });
  }

  async getAllExercises(): Promise<Exercise[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const exercises = request.result as Exercise[];
        exercises.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(exercises);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as Exercise);
      request.onerror = () => reject(request.error);
    });
  }

  async saveExercise(exercise: Exercise): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(exercise);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExercise(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTestRecord(record: TestRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEST_RECORD_STORE], 'readwrite');
      const store = transaction.objectStore(TEST_RECORD_STORE);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTestRecordsByExerciseId(exerciseId: string): Promise<TestRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEST_RECORD_STORE], 'readonly');
      const store = transaction.objectStore(TEST_RECORD_STORE);
      const index = store.index('exerciseId');
      const request = index.getAll(exerciseId);

      request.onsuccess = () => {
        const records = request.result as TestRecord[];
        records.sort((a, b) => b.completedAt - a.completedAt);
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestTestRecord(exerciseId: string): Promise<TestRecord | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEST_RECORD_STORE], 'readonly');
      const store = transaction.objectStore(TEST_RECORD_STORE);
      const index = store.index('exerciseId');
      const request = index.getAll(exerciseId);

      request.onsuccess = () => {
        const records = request.result as TestRecord[];
        if (records.length === 0) {
          resolve(undefined);
        } else {
          records.sort((a, b) => b.completedAt - a.completedAt);
          resolve(records[0]);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
