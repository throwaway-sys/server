import mongoose from 'mongoose';

const userHistorySchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }
  },
  { timestamps: true }
);

const UserHistory = mongoose.model('userhistories', userHistorySchema);
export default UserHistory;