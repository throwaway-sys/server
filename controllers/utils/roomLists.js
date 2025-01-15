import Room from '../../models/Room.js';
import UserHistory from '../../models/UserHistory.js';
import similarity from 'compute-cosine-similarity';

/**
 * 1. get all userhistory records and all rooms
 * 2. arrange it in an array like this
        userHistoryArray = [{userId: user1, rooms: [room1, room2, ...]}, {userId: user2, rooms: [room1, room2, ...]}, ...]
 * 3. filter out userhistory of userId from input as current_userhistory
 * 4. loop through userhistories and calculate cosine similarity of current_userhistory with every userhistory and fill array cosine_similarities
        cosine_similarities = [{user2: 0.5}, {user3: 0.6}, {user4: 0.4}, {user5: 0.3}, ...]
 * 5. get rooms of top 3 users with highest cosine_similarities eg: user2, user3 and user4 from above example. Put it into recommendations array in order of highest cosine_similarities
        eg: recommendation from user2 : room2, user3: room3, user4: room4 (can be multiple rooms from one user)
        So based on cosine similarities of user2, user3 and user4
        recommendedRoomIds = [room3, room2, room4]
 * 6. filter out rooms that are already in current user history from recommendations
 * 7. get details of room from recommendations and return it
 *      recommendations = [{roomId: room3, roomName: 'room3', ...}, {roomId: room2, roomName: 'room2', ...}, {roomId: room4, roomName: 'room4', ...}]
 * 8. return recommendations
 */
export const roomRecommendations = async(userId, recommendUsersCount) => {
    userId = userId.toString();
    // 1. get all userhistory records and all rooms
    const userHistories = await UserHistory.find();
    const rooms = await Room.find(); 

    // 2. arrange it in an array like this
    //     userHistoryArray = [{userId: user1, rooms: [room1, room2, ...]}, {userId: user2, rooms: [room1, room2, ...]}, ...]
    let uniqueUsers = [...new Set(userHistories.map(uh => uh.userId.toString()))];
    let userHistoryArray = [];

    for(let userId of uniqueUsers) {
        let rooms = userHistories.filter(uh => uh.userId.toString() === userId).map(uh => uh.roomId.toString());
        userHistoryArray.push({userId: userId, rooms});
    }

    // * 3. filter out userhistory of userId from input as current_userhistory
    let current_userhistory = userHistoryArray.find(uh => uh.userId.toString() === userId);

    // new user will have no history, return empty in this case
    if(current_userhistory.length == 0) {
        return [];
    }

    userHistoryArray = userHistoryArray.filter(uh => uh.userId.toString() !== userId);

    // * 4. loop through userhistories and calculate cosine similarity of current_userhistory with every userhistory and fill array cosine_similarities
    //     cosine_similarities = [{user2: 0.5}, {user3: 0.6}, {user4: 0.4}, {user5: 0.3}, ...]
    let cosine_similarities = [];
    for(let uh of userHistoryArray) {

        // cosine similarity only works for integer arrays, so mapping the string roomIds to integer indexes
        let roomIdToIndex = {};
        let index = 0;
        let allRooms = [...new Set([...current_userhistory.rooms, ...uh.rooms])];
        allRooms.forEach(roomId => {
            if (!roomIdToIndex[roomId]) {
                roomIdToIndex[roomId] = index++;
            }
        });

        let currentUserHistoryRoomsArrayMapped = current_userhistory.rooms.map(roomId => roomIdToIndex[roomId]);
        let userHistoryRoomsArrayMapped = uh.rooms.map(roomId => roomIdToIndex[roomId]);

        // cosine similarity arrays must be of same length
        let arrays = equalizeTwoArrays(currentUserHistoryRoomsArrayMapped, userHistoryRoomsArrayMapped);

        let cosine_similarity = similarity(arrays.smallerArray, arrays.greaterArray);
        cosine_similarities.push({[uh.userId]: cosine_similarity});
    }

    // * 5. get rooms of top 3 users with highest cosine_similarities eg: user2, user3 and user4 from above example. Put it into recommendations array in order of highest cosine_similarities
    //     eg: recommendation from user2 : room2, user3: room3, user4: room4 (can be multiple rooms from one user)
    //     So based on cosine similarities of user2, user3 and user4
    //     recommendations = [room3, room2, room4]
    cosine_similarities.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]);
    let recommendedRoomIds = [];

    for(let i = 0; i < recommendUsersCount; i++) {
        let cosine_similarity = cosine_similarities[i];
        let userId = Object.keys(cosine_similarity)[0];
        let userHistory = userHistoryArray.find(uh => uh.userId === userId);
        recommendedRoomIds.push(...userHistory.rooms);
    }

    // * 6. filter out rooms that are already in current user history from recommendations
    recommendedRoomIds = recommendedRoomIds.filter(room => !current_userhistory.rooms.includes(room));
    
    // * 7. get details of room from recommendations and return it
    // *    recommendations = [{roomId: room3, roomName: 'room3', ...}, {roomId: room2, roomName: 'room2', ...}, {roomId: room4, roomName: 'room4', ...}]
    let recommendations = [];
    for(let roomId of recommendedRoomIds) {
        let room = rooms.find(room => room._id.toString() === roomId);
        if(room && recommendations.filter(r => r._id.toString() === room._id.toString()).length < 1) {
            recommendations.push(room);
        }
    }
    
    // order recommendations based on title
    recommendations = recommendations.sort((a, b) => a.title.localeCompare(b.title));

    // * 8. return recommendations
    return recommendations;
};

/**
 * 1. get all userhistory records and all rooms
 * 2. get details of rooms that are in userhistory of userId
 * 3. return userHistories
 */
export const userHistories = async(userId) => {
    // * 1. get all userhistory records and all rooms
    const userHistories = await UserHistory.find({userId: userId}).sort({ createdAt: -1 });
    const rooms = await Room.find();

    // * 2. return details of rooms that are in userhistory of userId
    let userHistoryRooms = [];
    for(let userHistory of userHistories) {
        let room = rooms.find(r => r._id.toString() === userHistory.roomId.toString());
        if(room && userHistoryRooms.filter(uh => uh?._id?.toString() === room?._id?.toString()).length < 1) {
            userHistoryRooms.push(room);
        }
    }

    // * 3. return userHistories
    return userHistoryRooms;
};

/**
 * function to make length of two arrays equal by adding random integers to the smaller array
 * @param {*} array 
 * @param {*} array2 
 * @returns object with smallerArray and greaterArray
 */
const equalizeTwoArrays = (array, array2) => {
    let smallerArray = array.length < array2.length ? array : array2;
    let greaterArray = array.length < array2.length ? array2 : array;

    while (smallerArray.length < greaterArray.length) {
        smallerArray.push(0);
    }
    
    return {smallerArray, greaterArray};
}