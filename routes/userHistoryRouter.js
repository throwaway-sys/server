import { Router } from 'express';
import { getHistories, addHistory } from '../controllers/userHistory.js';
import auth from '../middleware/auth.js';

const userHistoryRouter = Router();
userHistoryRouter.get('/', auth, getHistories);
userHistoryRouter.post('/:roomId', auth, addHistory);

export default userHistoryRouter;