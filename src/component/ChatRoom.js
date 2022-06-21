import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";

var stompClient = null;
const ChatRoom = () => {
  const [publicChats, setpublicChats] = useState([]);
  const [privateChats, setprivateChats] = useState(new Map());
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });

  const handleUserName = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  const registerUser = () => {
    let Sock = new SockJS("http//localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connected({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessageReceived
    );
  };

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setpublicChats(...publicChats);
        break;
    }

    const onPrivateMessageReceived = (payload) => {
      let payloadData = JSON.parse(payload);
      if (privateChats.get(payloadData.senderName)) {
        privateChats.set(payloadData.senderName).push(payloadData);
        setprivateChats(new Map(privateChats));
      } else {
        let list = [];
        list.push(payloadData);

        privateChats.set(payloadData.senderName).push(list);
        setprivateChats(new Map(privateChats));
      }
    };
  };

  const onError = (err) => {
    console.log(err);
  };
  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li>Chatroom</li>
              {[...privateChats.keys()].map((name, index) => (
                <li className="member" key={index}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-content">
            {[publicChats.keys()].map((chat, index) => (
              <li className="member" key={index}>
                {chat.senderName !== userData.username && (
                  <div className="avatar"> {chat.senderName} </div>
                )}
              </li>
            ))}
          </div>
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter the user name"
            value={userData.username}
            onChange={handleUserName}
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
