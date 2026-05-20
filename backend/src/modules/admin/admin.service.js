// admin.service.js delegates to history.service for shared data operations.
// Admin-specific business logic (e.g., bulk operations, audit logging) goes here.
import * as historyService from '../history/history.service.js';

export const getAllHistoryData = historyService.getAllHistoryData;
export const saveAllHistoryData = historyService.saveAllHistoryData;
export const updateDynasty = historyService.updateDynasty;
export const updateCharacter = historyService.updateCharacter;

// Add admin-specific operations below as the feature grows:
// export const bulkUpdateDynasties = async (updates) => { ... };
