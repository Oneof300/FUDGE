import * as FudgeNetwork from "../ModuleCollectorClient.js";
export class ClientManagerFullMeshStructure {
    remoteMeshClients;
    currentlyNegotiatingClient;
    establishedDataChannelsWithRemoteIds;
    signalingServerConnectionUrl = "ws://localhost:8080";
    localUserName;
    localClientID;
    webSocketConnectionToSignalingServer;
    isInitiator;
    // More info from here https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
    // tslint:disable-next-line: typedef
    configuration = {
        iceServers: [
            { urls: "stun:stun2.1.google.com:19302" },
            { urls: "stun:stun.example.com" }
        ]
    };
    serverSentMeshClients;
    constructor() {
        this.localUserName = "";
        this.localClientID = "undefined";
        this.isInitiator = false;
        this.remoteMeshClients = new Array();
        this.currentlyNegotiatingClient = new FudgeNetwork.ClientDataType();
    }
    // public startUpSignalingServerFile = (_serverFileUri: string): void => {
    //     // TODO You can start the signaling server inside  the componente, so it can be toggled/clicked to make it happen
    //     let server_test = require("./Server/ServerMain");
    // }
    connectToSignalingServer = () => {
        try {
            this.webSocketConnectionToSignalingServer = new WebSocket(this.signalingServerConnectionUrl);
            this.addWebSocketEventListeners();
        }
        catch (error) {
            console.log("Websocket Generation gescheitert");
        }
    };
    addWebSocketEventListeners = () => {
        try {
            this.webSocketConnectionToSignalingServer.addEventListener("open", (_connOpen) => {
                console.log("Conneced to the signaling server", _connOpen);
            });
            this.webSocketConnectionToSignalingServer.addEventListener("error", (_err) => {
                console.error(_err);
            });
            this.webSocketConnectionToSignalingServer.addEventListener("message", (_receivedMessage) => {
                this.parseMessageAndHandleMessageType(_receivedMessage);
            });
        }
        catch (error) {
            console.error("Unexpected Error: Adding websocket Eventlistener", error);
        }
    };
    parseMessageAndHandleMessageType = (_receivedMessage) => {
        // tslint:disable-next-line: typedef
        let objectifiedMessage = this.parseReceivedMessageAndReturnObject(_receivedMessage);
        switch (objectifiedMessage.messageType) {
            case FudgeNetwork.MESSAGE_TYPE.ID_ASSIGNED:
                console.log("ID received, assigning to self");
                this.assignIdAndSendConfirmation(objectifiedMessage);
                break;
            case FudgeNetwork.MESSAGE_TYPE.LOGIN_RESPONSE:
                this.loginValidAddUser(objectifiedMessage);
                break;
            case FudgeNetwork.MESSAGE_TYPE.SERVER_SEND_MESH_CANDIDATES_TO_CLIENT:
                console.log("Received Client Mesh Array: ", _receivedMessage);
                this.beginnMeshConnection(objectifiedMessage);
                break;
            case FudgeNetwork.MESSAGE_TYPE.RTC_OFFER:
                // console.log("Received offer, current signaling state: ", this.connection.signalingState);
                this.receiveNegotiationOfferAndSetRemoteDescription(objectifiedMessage);
                break;
            case FudgeNetwork.MESSAGE_TYPE.RTC_ANSWER:
                // console.log("Received answer, current signaling state: ", this.connection.signalingState);
                this.receiveAnswerAndSetRemoteDescription(objectifiedMessage);
                break;
            case FudgeNetwork.MESSAGE_TYPE.ICE_CANDIDATE:
                // console.log("Received candidate, current signaling state: ", this.connection.signalingState);
                this.addReceivedCandidateToPeerConnection(objectifiedMessage);
                break;
        }
    };
    beginnMeshConnection(_meshClientMessage) {
        if (_meshClientMessage) {
            this.serverSentMeshClients = _meshClientMessage.candidateArray;
        }
        let clientIdToConnectTo = this.serverSentMeshClients[0].id;
        this.beginPeerConnectionNegotiation(clientIdToConnectTo);
        if (this.serverSentMeshClients.length > 0) {
            this.serverSentMeshClients.splice(1, 0);
            this.beginnMeshConnection();
        }
        else {
            this.sendFinishingSignal();
        }
    }
    sendReadySignalToServer() {
        let readyToConnectMessage = new FudgeNetwork.NetworkMessageClientReady(this.localClientID);
        this.sendMessageToSignalingServer(readyToConnectMessage);
    }
    sendFinishingSignal() {
        let connectedToMeshMessage = new FudgeNetwork.NetworkMessageClientIsMeshConnected(this.localClientID);
        this.sendMessageToSignalingServer(connectedToMeshMessage);
    }
    checkChosenUsernameAndCreateLoginRequest = (_loginName) => {
        if (_loginName.length <= 0) {
            console.log("Please enter username");
            return;
        }
        this.createLoginRequestAndSendToServer(_loginName);
    };
    createMeshClientAndAddPeerConnection() {
        let newMeshClient = new FudgeNetwork.ClientDataType();
        let newClientPeerConnection = new RTCPeerConnection(this.configuration);
        newClientPeerConnection.addEventListener("icecandidate", this.sendIceCandidatesToPeer);
        newMeshClient.rtcPeerConnection = newClientPeerConnection;
        return newMeshClient;
    }
    addNewMeshClientToMeshClientCollection(_meshClient) {
        this.remoteMeshClients.push(_meshClient);
    }
    beginPeerConnectionNegotiation = (_userIdToOffer) => {
        // Initiator is important for direct p2p connections
        let currentlyNegotiatingPeer = this.createMeshClientAndAddPeerConnection();
        currentlyNegotiatingPeer.id = _userIdToOffer;
        if (currentlyNegotiatingPeer != null) {
            try {
                currentlyNegotiatingPeer.rtcDataChannel = currentlyNegotiatingPeer.rtcPeerConnection?.createDataChannel(currentlyNegotiatingPeer.id);
                currentlyNegotiatingPeer.rtcDataChannel?.addEventListener("open", this.dataChannelStatusChangeHandler);
                currentlyNegotiatingPeer.rtcDataChannel?.addEventListener("close", this.dataChannelStatusChangeHandler);
                currentlyNegotiatingPeer.rtcDataChannel?.addEventListener("message", this.dataChannelMessageHandler);
            }
            catch (error) {
                console.error("Unexpected Error: Creating Client Datachannel and adding Listeners", error);
            }
            currentlyNegotiatingPeer.rtcPeerConnection?.createOffer()
                .then(async (offer) => {
                console.log("Beginning of createOffer in InitiateConnection, Expected 'stable', got:  ", currentlyNegotiatingPeer.rtcPeerConnection?.signalingState);
                return offer;
            })
                .then(async (offer) => {
                await currentlyNegotiatingPeer.rtcPeerConnection?.setLocalDescription(offer);
                console.log("Setting LocalDesc, Expected 'have-local-offer', got:  ", currentlyNegotiatingPeer.rtcPeerConnection?.signalingState);
            })
                .then(() => {
                this.addNewMeshClientToMeshClientCollection(currentlyNegotiatingPeer);
                this.createNegotiationOfferAndSendToPeer(currentlyNegotiatingPeer);
            })
                .catch((error) => {
                console.error("Unexpected Error: Creating RTCOffer", error);
            });
        }
    };
    createNegotiationOfferAndSendToPeer = (_currentlyNegotiatingPeer) => {
        try {
            const offerMessage = new FudgeNetwork.NetworkMessageRtcOffer(this.localClientID, _currentlyNegotiatingPeer.id, _currentlyNegotiatingPeer.rtcPeerConnection?.localDescription);
            this.sendMessageToSignalingServer(offerMessage);
            console.log("Sent offer to remote peer, Expected 'have-local-offer', got:  ", _currentlyNegotiatingPeer.rtcPeerConnection?.signalingState);
        }
        catch (error) {
            console.error("Unexpected Error: Creating Object and Sending RTC Offer", error);
        }
    };
    receiveNegotiationOfferAndSetRemoteDescription = (_offerMessage) => {
        // DAS IST VON DER ANDEREN SEITE
        let newlyReceivedClient = new FudgeNetwork.ClientDataType(undefined, _offerMessage.originatorId, new RTCPeerConnection(this.configuration));
        this.remoteMeshClients.push(newlyReceivedClient);
        newlyReceivedClient.rtcPeerConnection?.addEventListener("datachannel", this.receiveDataChannelAndEstablishConnection);
        let offerToSet = _offerMessage.offer;
        if (!offerToSet) {
            return;
        }
        newlyReceivedClient.rtcPeerConnection?.setRemoteDescription(new RTCSessionDescription(offerToSet))
            .then(async () => {
            console.log("Received Offer and Set Descirpton, Expected 'have-remote-offer', got:  ", newlyReceivedClient.rtcPeerConnection?.signalingState);
            await this.answerNegotiationOffer(newlyReceivedClient);
        })
            .catch((error) => {
            console.error("Unexpected Error: Setting Remote Description and Creating Answer", error);
        });
        console.log("End of Function Receive offer, Expected 'stable', got:  ", newlyReceivedClient.rtcPeerConnection?.signalingState);
    };
    answerNegotiationOffer = (_remoteMeshClient) => {
        let ultimateAnswer;
        // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
        _remoteMeshClient.rtcPeerConnection?.createAnswer()
            .then(async (answer) => {
            console.log("Create Answer before settign local desc: Expected 'have-remote-offer', got:  ", _remoteMeshClient.rtcPeerConnection?.signalingState);
            ultimateAnswer = new RTCSessionDescription(answer);
            return await _remoteMeshClient.rtcPeerConnection?.setLocalDescription(ultimateAnswer);
        }).then(async () => {
            console.log("CreateAnswerFunction after setting local descp, Expected 'stable', got:  ", _remoteMeshClient.rtcPeerConnection?.signalingState);
            const answerMessage = new FudgeNetwork.NetworkMessageRtcAnswer(this.localClientID, _remoteMeshClient.id, "", ultimateAnswer);
            console.log("AnswerObject: ", answerMessage);
            await this.sendMessageToSignalingServer(answerMessage);
        })
            .catch((error) => {
            console.error("Unexpected error: Creating RTC Answer failed", error);
        });
    };
    receiveAnswerAndSetRemoteDescription = (_rtcAnswer) => {
        try {
            let descriptionAnswer = new RTCSessionDescription(_rtcAnswer.answer);
            let remoteClientId = _rtcAnswer.originatorId;
            this.currentlyNegotiatingClient.rtcPeerConnection?.setRemoteDescription(descriptionAnswer);
        }
        catch (error) {
            console.error("Unexpected Error: Setting Remote Description from Answer", error);
        }
    };
    // tslint:disable-next-line: no-any
    sendIceCandidatesToPeer = ({ candidate }) => {
        try {
            let message = new FudgeNetwork.NetworkMessageIceCandidate(this.localClientID, this.currentlyNegotiatingClient.id, candidate);
            this.sendMessageToSignalingServer(message);
        }
        catch (error) {
            console.error("Unexpected Error: Creating and Sending ICECandidates to Peer", error);
        }
    };
    addReceivedCandidateToPeerConnection = async (_receivedIceMessage) => {
        let relevantClient = this.searchNegotiatingClientById(_receivedIceMessage.originatorId, this.remoteMeshClients);
        try {
            if (relevantClient) {
                await relevantClient.rtcPeerConnection?.addIceCandidate(_receivedIceMessage.candidate);
            }
        }
        catch (error) {
            console.error("Unexpected Error: Adding Ice Candidate", error);
        }
    };
    receiveDataChannelAndEstablishConnection = (_event) => {
        if (_event.channel) {
            this.currentlyNegotiatingClient.rtcDataChannel = _event.channel;
            this.currentlyNegotiatingClient.rtcDataChannel.addEventListener("message", this.dataChannelMessageHandler);
            this.currentlyNegotiatingClient.rtcDataChannel.addEventListener("open", () => {
                console.log("Connection esabtlished");
            });
            this.currentlyNegotiatingClient.rtcDataChannel.addEventListener("close", this.dataChannelStatusChangeHandler);
        }
        else {
            console.error("Unexpected Error: RemoteDatachannel");
        }
    };
    sendMessageToSignalingServer = (_message) => {
        let stringifiedMessage = this.stringifyObjectForNetworkSending(_message);
        if (this.webSocketConnectionToSignalingServer.readyState == 1) {
            this.webSocketConnectionToSignalingServer.send(stringifiedMessage);
        }
        else {
            console.error("Websocket Connection closed unexpectedly");
        }
    };
    enableKeyboardPressesForSending = (_keyCode) => {
        //EScape knopf
        if (_keyCode == 27) {
            //
        }
        else {
            this.sendKeyPress(_keyCode);
        }
    };
    sendKeyPress = (_keyCode) => {
        // try {
        //     if (this.remoteEventPeerDataChannel != undefined) {
        //         let keyPressMessage: FudgeNetwork.PeerMessageKeysInput = new FudgeNetwork.PeerMessageKeysInput(this.localClientID, _keyCode);
        //         let stringifiedObject: string = this.stringifyObjectForNetworkSending(keyPressMessage);
        //         this.sendMessageToServerViaDataChannel(stringifiedObject);
        //     }
        // } catch (error) { console.error("Unexpected Error: Send Key Press", error); }
    };
    // tslint:disable-next-line: no-any
    parseReceivedMessageAndReturnObject = (_receivedMessage) => {
        // tslint:disable-next-line: no-any
        let objectifiedMessage;
        try {
            console.log("RECEIVED: ", _receivedMessage);
            objectifiedMessage = JSON.parse(_receivedMessage.data);
        }
        catch (error) {
            console.error("Invalid JSON", error);
        }
        return objectifiedMessage;
    };
    dataChannelMessageHandler = (_messageEvent) => {
        if (_messageEvent) {
            // tslint:disable-next-line: no-any
            let parsedObject = this.parseReceivedMessageAndReturnObject(_messageEvent);
            FudgeNetwork.UiElementHandler.chatbox.innerHTML += "\n" + parsedObject.messageData.originatorId + ": " + parsedObject.messageData;
            FudgeNetwork.UiElementHandler.chatbox.scrollTop = FudgeNetwork.UiElementHandler.chatbox.scrollHeight;
        }
    };
    getLocalClientId() {
        return this.localClientID;
    }
    getLocalUserName() {
        return this.localUserName == "" || undefined ? "Kein Username vergeben" : this.localUserName;
    }
    searchNegotiatingClientById(_idToSearch, arrayToSearch) {
        arrayToSearch.forEach(meshClient => {
            if (meshClient.id === _idToSearch) {
                return meshClient;
            }
        });
        return null;
    }
    createLoginRequestAndSendToServer = (_requestingUsername) => {
        try {
            const loginMessage = new FudgeNetwork.NetworkMessageLoginRequest(this.localClientID, _requestingUsername);
            this.sendMessageToSignalingServer(loginMessage);
        }
        catch (error) {
            console.error("Unexpected error: Sending Login Request", error);
        }
    };
    loginValidAddUser = (_loginResponse) => {
        let loginSuccess = _loginResponse.loginSuccess;
        let originatorUserName = _loginResponse.originatorUsername;
        if (loginSuccess) {
            this.setOwnUserName(originatorUserName);
            console.log("Local Username: " + this.localUserName);
        }
        else {
            console.log("Login failed, username taken");
        }
    };
    assignIdAndSendConfirmation = (_message) => {
        try {
            this.setOwnClientId(_message.assignedId);
            this.sendMessageToSignalingServer(new FudgeNetwork.NetworkMessageIdAssigned(this.localClientID));
        }
        catch (error) {
            console.error("Unexpected Error: Sending ID Confirmation", error);
        }
    };
    stringifyObjectForNetworkSending = (_objectToStringify) => {
        let stringifiedObject = "";
        try {
            stringifiedObject = JSON.stringify(_objectToStringify);
        }
        catch (error) {
            console.error("JSON Parse failed", error);
        }
        return stringifiedObject;
    };
    setOwnClientId(_id) {
        this.localClientID = _id;
    }
    setOwnUserName(_name) {
        this.localUserName = _name;
    }
    dataChannelStatusChangeHandler = (event) => {
        //TODO Reconnection logic
        console.log("Channel Event happened", event);
    };
}
