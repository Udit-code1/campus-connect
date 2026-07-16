/**
 * Register handlers for Socket.io events
 * @param {Server} io - Socket.io Server instance
 * @param {Socket} socket - Authenticated socket client
 */
const registerSocketHandlers = (io, socket) => {
  const userId = socket.user._id.toString();
  console.log(`🔌 User connected to websocket: ${socket.user.name} (${userId})`);

  // 1. Join a private room unique to this user
  socket.join(userId);

  // 2. Join department-specific room (e.g. "dept:computer_science")
  if (socket.user.department) {
    const deptRoom = `dept:${socket.user.department.toLowerCase().trim().replace(/\s+/g, '_')}`;
    socket.join(deptRoom);
    console.log(`🔌 User ${socket.user.name} joined room: ${deptRoom}`);
  }

  // 3. Join interest-specific rooms if user has interests
  if (socket.user.interests && Array.isArray(socket.user.interests)) {
    socket.user.interests.forEach((interest) => {
      const interestRoom = `interest:${interest.toLowerCase().trim().replace(/\s+/g, '_')}`;
      socket.join(interestRoom);
    });
  }

  // Handle joining real-time event discussion/live-updates room
  socket.on('event:join', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`🔌 Socket ${socket.id} joined live updates for event: ${eventId}`);
  });

  socket.on('event:leave', (eventId) => {
    socket.leave(`event:${eventId}`);
    console.log(`🔌 Socket ${socket.id} left live updates for event: ${eventId}`);
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected from websocket: ${socket.user.name} (${userId})`);
  });
};

module.exports = { registerSocketHandlers };
