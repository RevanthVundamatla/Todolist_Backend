const Todo = require('../models/Todo');
const redisClient = require('../config/redis');

exports.getTodos = async (req, res) => {
  try {
    const cacheKey = `todos:${req.user.userId}`;
    let todos = await redisClient.get(cacheKey);
    
    if (todos) {
      return res.json({ todos: JSON.parse(todos), fromCache: true });
    }

    todos = await Todo.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    await redisClient.setEx(cacheKey, 300, JSON.stringify(todos));
    res.json({ todos, fromCache: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTodo = async (req, res) => {
  try {
    const todo = new Todo({ ...req.body, userId: req.user.userId });
    await todo.save();
    await redisClient.del(`todos:${req.user.userId}`);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    
    await redisClient.del(`todos:${req.user.userId}`);
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    
    await redisClient.del(`todos:${req.user.userId}`);
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};