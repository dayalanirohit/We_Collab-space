const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);


const userSocketMap = {};  // this is to store username - socketid in a map 


// the below function is to get all the connected usernames & their socketids

const getAllConnectedClients = (roomId) => {                    
   return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
        return {
            socketId,
            username : userSocketMap[socketId],
        }
   });
};


io.on("connection", (socket) => {
    
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({socketId}) =>{
            io.to(socketId).emit(ACTIONS.JOINED,{
                clients,
                username,
                socketId: socket.id,
            });
        });
    });




    // to sync the code written in editor

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });


    // when new user join the room all the code which are there are also shows on that persons editor
    
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

 
    // For disconnect of users - if any user closes the tab / opens another tab


    socket.on('disconnecting' , ()=>{
        
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

        });

        delete userSocketMap[socket.id];
        socket.leave();
    });


   // for notes editor 

   socket.on('init', async () => {
        try {
          const doc = await Document.findOne();
          socket.emit('init', { content: doc ? doc.content : '' });
        } catch (error) {
          console.error('Error initializing document:', error);
        }
      });
    
      socket.on('update', async ({ content }) => {
        try {
          let doc = await Document.findOne();
          if (!doc) {
            doc = new Document({ content });
          } else {
            doc.content = content;
          }
          await doc.save();
          io.emit('update', { content });
        } catch (error) {
          console.error('Error updating document:', error);
        }
      });

});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
 



 
