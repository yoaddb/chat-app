const users = [];

const addUser = ({ id, username, room }) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (!room || !username) return { error: "Username and room are required!" };

  const existingUser = users.find(
    u => u.room === room && u.username === username
  );

  if (existingUser) return { error: "User already exists!" };

  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = id => {
  const index = users.findIndex(u => u.id === id);

  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = id => {
  return users.find(u => u.id === id);
};

const getUsersInRoom = room => {
  room = room.trim().toLowerCase();
  return users.filter(u => u.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};
