import express from 'express';
import {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  bulkUpdateStatus,
  bulkDelete,
} from '../controllers/todoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getTodos);
router.post('/', createTodo);
router.get('/:id', getTodoById);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);
router.patch('/bulk/status', bulkUpdateStatus);
router.delete('/bulk/delete', bulkDelete);

export default router;
