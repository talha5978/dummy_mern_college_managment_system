import { Router } from 'express';
import { createSection, getAllSections, updateSection, deleteSection } from "../controllers/sections.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();
//router.use(verifyJwt);

router
    .route('/')
    .get(getAllSections)
    .post(createSection)
    .patch(updateSection);

router
    .route('/:sectionId')
    .delete(deleteSection)
  
export default router;