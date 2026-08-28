import express from 'express';
import Component from '../models/Component.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { extractKeywords, getRecommendedComponents } from '../utils/recommendationEngine.js';

const router = express.Router();

// @desc    Get all components with search and category filters
// @route   GET /api/components
// @access  Private/Public
router.get('/', async (req, res) => {
  const { search, category } = req.query;
  let query = {};

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { keywords: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  try {
    const components = await Component.find(query);
    res.json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get recommendations based on project text details
// @route   POST /api/components/recommend
// @access  Private
router.post('/recommend', protect, async (req, res) => {
  const { title, domain, description } = req.body;

  try {
    const projectKeywords = extractKeywords(title, domain, description);
    const allComponents = await Component.find({});
    const recommendations = getRecommendedComponents(projectKeywords, allComponents);
    
    res.json({
      keywords: projectKeywords,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get component by ID
// @route   GET /api/components/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    if (component) {
      res.json(component);
    } else {
      res.status(404).json({ message: 'Component not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new component
// @route   POST /api/components
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, category, specs, quantityTotal, imageUrl, keywords, description } = req.body;

  try {
    const componentExists = await Component.findOne({ name });
    if (componentExists) {
      return res.status(400).json({ message: 'Component with this name already exists' });
    }

    const component = new Component({
      name,
      category,
      specs: specs || {},
      quantityTotal: Number(quantityTotal),
      quantityAvailable: Number(quantityTotal),
      imageUrl,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
      description
    });

    const savedComponent = await component.save();
    res.status(201).json(savedComponent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a component
// @route   PUT /api/components/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { name, category, specs, quantityTotal, quantityAvailable, imageUrl, keywords, description } = req.body;

  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    component.name = name || component.name;
    component.category = category || component.category;
    component.specs = specs || component.specs;
    component.imageUrl = imageUrl !== undefined ? imageUrl : component.imageUrl;
    component.description = description || component.description;
    
    // Manage stock levels safely
    if (quantityTotal !== undefined) {
      const difference = Number(quantityTotal) - component.quantityTotal;
      component.quantityTotal = Number(quantityTotal);
      component.quantityAvailable = Math.max(0, component.quantityAvailable + difference);
    }
    
    if (quantityAvailable !== undefined) {
      component.quantityAvailable = Math.min(component.quantityTotal, Number(quantityAvailable));
    }

    if (keywords) {
      component.keywords = Array.isArray(keywords) 
        ? keywords 
        : keywords.split(',').map(k => k.trim());
    }

    const updatedComponent = await component.save();
    res.json(updatedComponent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a component
// @route   DELETE /api/components/:id
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    if (component) {
      await Component.deleteOne({ _id: req.params.id });
      res.json({ message: 'Component removed successfully' });
    } else {
      res.status(404).json({ message: 'Component not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
