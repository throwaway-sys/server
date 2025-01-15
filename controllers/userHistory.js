import UserHistory from '../models/UserHistory.js';
import tryCatch from './utils/tryCatch.js';

export const addHistory = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const roomId = req.params.roomId;
  const newHistory = new UserHistory({ userId, roomId });
  await newHistory.save();
  res.status(201).json({ success: true, result: newHistory });
});

export const getHistories = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const histories = await UserHistory.find({ userId }).sort({ _id: -1 });
  res.status(200).json({ success: true, result: histories });
});