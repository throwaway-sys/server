import Room from '../models/Room.js';
import tryCatch from './utils/tryCatch.js';
import { roomRecommendations, userHistories } from './utils/roomLists.js';

export const createRoom = tryCatch(async (req, res) => {
  const { id: uid, name: uName, photoURL: uPhoto } = req.user;
  const newRoom = new Room({ ...req.body, uid, uName, uPhoto });
  await newRoom.save();
  res.status(201).json({ success: true, result: newRoom });
});

export const getRooms = tryCatch(async (req, res) => {
  // get option from query
  const roomOption = req.query?.option?.toLowerCase();
  let results = [];

  // if option is not implemented in front end yet, return all 3 by uncommenting the following
  // and commenting out the if else block below
  // if(req.user && req.user.id) {
  //  let recommendations = await roomRecommendations(req.user.id, 3);
  //  results.push(recommendations);
  // }
  // if(req.user && req.user.id) {
  //  let histories = await userHistories(req.user.id);
  //  results.push(histories.filter(history => !results.some(results => results._id === history._id)));
  // }
  // let allRooms = await Room.find().sort({ title: 1 });
  // results.push(allRooms.filter(room => !results.some(results => results._id === room._id));

  // if option is recommend, get recommendations
  if (roomOption === 'recommend') {
    results = await roomRecommendations(req.user.id, 1);
  }
  // if option is history, get user histories
  else if (roomOption === 'history') {
    results = await userHistories(req.user.id);
  }
  // else get all rooms
  else {
    results = await Room.find().sort({ title: 1 });
  }

  return res.status(200).json({ success: true, result: results || [] });
});

export const deleteRoom = tryCatch(async (req, res) => {
  const { _id } = await Room.findByIdAndDelete(req.params.roomId);
  res.status(200).json({ success: true, result: { _id } });
});

export const updateRoom = tryCatch(async (req, res) => {
  const updatedRoom = await Room.findByIdAndUpdate(
    req.params.roomId,
    req.body,
    { new: true }
  );
  res.status(200).json({ success: true, result: updatedRoom });
});
