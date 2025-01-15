import { Router } from 'express';

import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
} from '../controllers/room.js';
import auth from '../middleware/auth.js';
import checkAccess from './middleware/checkAccess.js';
import roomPermissions from '../middleware/permissions/room/roomPermissions.js';

const roomRouter = Router();
roomRouter.post('/', auth, createRoom);
roomRouter.get('/', (req, res, next) => {
  if (!['recommend', 'history'].includes(req.query?.option?.toLowerCase())) {
    next();
  } else {
    auth(req, res, next);
  }
}, getRooms);

roomRouter.delete(
  '/:roomId',
  auth,
  checkAccess(roomPermissions.delete),
  deleteRoom
);
roomRouter.patch(
  '/:roomId',
  auth,
  checkAccess(roomPermissions.update),
  updateRoom
);
export default roomRouter;