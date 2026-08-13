import { Router } from 'express';
import documentRoutes from './document.route.js';
import searchRoutes from './search.routes.js';
import chatRoutes from './chat.routes.js';


const router = Router();

router.use('/documents', documentRoutes);
router.use('/search', searchRoutes);
router.use('/chat', chatRoutes);


export default router;