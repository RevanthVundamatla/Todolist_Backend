import Todo from '../models/Todo.js';

const FREE_PLAN_LIMIT = 10;

export const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, tags } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (!req.user.isPremium) {
      const count = await Todo.countDocuments({ user: req.user._id });
      if (count >= FREE_PLAN_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Free plan allows up to ${FREE_PLAN_LIMIT} todos. Upgrade to Premium for unlimited todos.`,
          requiresPremium: true,
        });
      }
    }

    const todo = await Todo.create({
      user: req.user._id,
      title,
      description,
      priority,
      dueDate,
      tags,
    });

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully.',
      data: todo,
    });
  } catch (err) {
    next(err);
  }
};

export const getTodos = async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      filter.status = status;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Todo.countDocuments(filter);

    const todos = await Todo.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const stats = await Todo.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statsMap = { pending: 0, in_progress: 0, completed: 0 };
    stats.forEach((s) => (statsMap[s._id] = s.count));

    return res.status(200).json({
      success: true,
      data: {
        todos,
        stats: statsMap,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        isPremium: req.user.isPremium,
        remainingFree: req.user.isPremium ? null : Math.max(0, FREE_PLAN_LIMIT - total),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTodoById = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    return res.status(200).json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
};

export const updateTodo = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (status !== undefined) todo.status = status;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (tags !== undefined) todo.tags = tags;

    await todo.save();

    return res.status(200).json({
      success: true,
      message: 'Todo updated successfully.',
      data: todo,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    return res.status(200).json({ success: true, message: 'Todo deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Todo IDs array is required.' });
    }

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await Todo.updateMany({ _id: { $in: ids }, user: req.user._id }, updateData);

    return res.status(200).json({
      success: true,
      message: `${ids.length} todos updated successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Todo IDs array is required.' });
    }

    await Todo.deleteMany({ _id: { $in: ids }, user: req.user._id });

    return res.status(200).json({
      success: true,
      message: `${ids.length} todos deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
