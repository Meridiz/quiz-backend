const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://anna-quiz.netlify.app",
        // origin: "http://localhost:3000",
        methods: ['GET', 'POST'],
    },
});


io.on("connection", (socket) => {
    console.log('user connected: ', socket.id);
   
    //debugging purposes
    socket.on('send_message', (data) => {
        console.log("message sent from: ", data.room)
        socket.to(data.room).emit('recieve_message', data.message);
    })

    let hostName;

    //creates a room if player is host
    socket.on('create_room', (data) => {
        hostName = data.username;
        socket.join(data.room);
        console.log('room created: ', data.room);
    })

    //joins a room if player is not host
    socket.on('join_room', (data) => {
        socket.join(data.room);
        socket.to(data.room).emit('recieve_host_name', hostName);
        socket.to(data.room).emit('recieve_player_data', data)
        console.log('room joined: ', data.room)
    })
   
    //start game of all players in room
    socket.on('host_start_game', (data) => {
        console.log("Host has started game: ", data.roomNum)
        socket.to(data.roomNum).emit('recieve_host_start', {hostStart: true, questions: data.questions});
    })
   
    //send player list to room
    socket.on('update_player_list', (data) => {
        socket.to(data.room).emit('recieve_updated_player_list', {players: data.players});
        console.log(data.players);
    })

    //emit player choices to room
    socket.on('player_choice', (data) => {
        socket.to(data.room).emit('recieve_player_choices', 
        {token: data.token, choice: data.choice});
    })
    
    //emit player choices to room
    socket.on('assign_tokenId', (data) => {
        socket.to(data.room).emit('recieve_token_index', data.players);
    })
   
    //emit final results
    // socket.on('assign_tokenId', (data) => {
    //     socket.to(data.room).emit('recieve_final_results', 
    //     {username: data.username, score: data.score});
    // })

    // EXCHANGE PLAYER SCORES
    // On Match End: When a player sends his score, the server uses this function to send that data to other players in the same room
    socket.on('send_player_score', (data) => {
        socket.to(data.room).emit('receive_player_score', {username: data.username, score: data.score});
    })
})

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})
