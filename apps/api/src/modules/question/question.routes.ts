// ============================================================
// DSATracker API — Question Routes
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { questionController } from './question.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createQuestionSchema, updateQuestionSchema, importUrlSchema,
  bulkCreateQuestionsSchema, importBulkUrlsSchema,
  createQuestionSetSchema, updateQuestionSetSchema,
} from './question.validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File upload config
const upload = multer({
  dest: path.resolve(__dirname, '../../../../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

const router = Router();
router.use(authenticate);

// Questions CRUD
router.post('/', requireAdmin, validate({ body: createQuestionSchema }), (req, res, next) => questionController.create(req, res, next));
router.post('/bulk', requireAdmin, validate({ body: bulkCreateQuestionsSchema }), (req, res, next) => questionController.createBulk(req, res, next));
router.get('/', (req, res, next) => questionController.list(req, res, next));
router.get('/search', (req, res, next) => questionController.search(req, res, next));
router.get('/:id', (req, res, next) => questionController.getById(req, res, next));
router.patch('/:id', requireAdmin, validate({ body: updateQuestionSchema }), (req, res, next) => questionController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => questionController.delete(req, res, next));

// Import
router.post('/import/url', requireAdmin, validate({ body: importUrlSchema }), (req, res, next) => questionController.importFromUrl(req, res, next));
router.post('/import/urls', requireAdmin, validate({ body: importBulkUrlsSchema }), (req, res, next) => questionController.importBulkUrls(req, res, next));
router.post('/import/excel', requireAdmin, upload.single('file'), (req, res, next) => questionController.importFromCsv(req, res, next));
router.post('/import/pdf', requireAdmin, upload.single('file'), (req, res, next) => questionController.importFromPdf(req, res, next));

// Question Sets
router.post('/sets', requireAdmin, validate({ body: createQuestionSetSchema }), (req, res, next) => questionController.createSet(req, res, next));
router.get('/sets', (req, res, next) => questionController.listSets(req, res, next));
router.get('/sets/:id', (req, res, next) => questionController.getSet(req, res, next));
router.patch('/sets/:id', requireAdmin, validate({ body: updateQuestionSetSchema }), (req, res, next) => questionController.updateSet(req, res, next));
router.delete('/sets/:id', requireAdmin, (req, res, next) => questionController.deleteSet(req, res, next));

export default router;
