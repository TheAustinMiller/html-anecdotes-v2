const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

function canModifyPost(post) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const postCreated = new Date(post.createdAt);
  return postCreated > thirtyMinutesAgo;
}

// GET /api/posts - Get all posts for the logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const posts = await db.getPostsByUser(userId, limit, offset);
    
    res.json({
      posts,
      user: req.user.username,
      count: posts.length
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:id - Get a specific post (only if user owns it)
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const post = await db.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns this post
    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own posts.' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts - Create a new post
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.length < 1 || title.length > 200) {
      return res.status(400).json({ error: 'Title must be between 1 and 200 characters' });
    }

    if (content.length < 1 || content.length > 10000) {
      return res.status(400).json({ error: 'Content must be between 1 and 10,000 characters' });
    }

    // Create post
    const result = await db.createPost(userId, title, content);
    
    // Get the created post with user info
    const newPost = await db.getPostById(result.id);

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id - Update a post (only if user owns it)
router.put('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if post exists and user owns it
    const existingPost = await db.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own posts.' });
    }

    // Check 30-minute window
    if (!canModifyPost(existingPost)) {
      return res.status(403).json({ error: 'Post can only be edited within 30 minutes of creation' });
    }

    // Update post
    await db.updatePost(postId, title, content);
    
    // Get updated post
    const updatedPost = await db.getPostById(postId);

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id - Delete a post (only if user owns it)
router.delete('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if post exists and user owns it
    const existingPost = await db.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    // Check 30-minute window
    if (!canModifyPost(existingPost)) {
      return res.status(403).json({ error: 'Post can only be edited within 30 minutes of creation' });
    }

    // Delete post
    await db.deletePost(postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;