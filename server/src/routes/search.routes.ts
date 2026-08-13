import { Router } from 'express';
import searchController from '../controllers/search.controller.js';
import { validateSearchBody } from '../validators/search.validator.js';


const router = Router();

// Search for relevant document content
router.post('/', validateSearchBody, searchController.search);


export default router;