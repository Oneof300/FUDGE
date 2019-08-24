import * as FudgeNetwork from "./../ModuleCollector";

let isServer: boolean = false;
const pureWebSocketClient: FudgeNetwork.PureWebSocketClientManager = new FudgeNetwork.PureWebSocketClientManager();
const pureWebSocketServer: FudgeNetwork.PureWebSocketServer = new FudgeNetwork.PureWebSocketServer();


FudgeNetwork.UiElementHandler.getPureWebSocketUiElements();
FudgeNetwork.UiElementHandler.startSignalingButton.addEventListener("click", startingUpSignalingServer);
FudgeNetwork.UiElementHandler.signalingSubmit.addEventListener("click", connectToSignalingServer);
FudgeNetwork.UiElementHandler.loginButton.addEventListener("click", createLoginRequestWithUsername);
FudgeNetwork.UiElementHandler.switchModeButton.addEventListener("click", switchServerMode);
FudgeNetwork.UiElementHandler.sendMsgButton.addEventListener("click", sendMessageToServer);
FudgeNetwork.UiElementHandler.sendMessageAsServer.addEventListener("click", broadcastMessageToClients);


FudgeNetwork.UiElementHandler.signalingElements.style.display = "block";
FudgeNetwork.UiElementHandler.serverElements.style.display = "none";

function broadcastMessageToClients() {
    let messageToBroadcast = new FudgeNetwork.NetworkMessageMessageToClient(FudgeNetwork.UiElementHandler.msgInputServer.value);
    pureWebSocketServer.broadcastMessageToAllConnectedClients(messageToBroadcast);
}
function startingUpSignalingServer(): void {
    pureWebSocketServer.startUpServer();
}

function connectToSignalingServer(): void {
    pureWebSocketClient.signalingServerConnectionUrl = "ws://" + FudgeNetwork.UiElementHandler.signalingUrl.value;
    pureWebSocketClient.connectToSignalingServer();
}

function createLoginRequestWithUsername(): void {
    let chosenUserName: string = "";
    console.log(FudgeNetwork.UiElementHandler.sendMsgButton);
    if (FudgeNetwork.UiElementHandler.loginNameInput) {
        chosenUserName = FudgeNetwork.UiElementHandler.loginNameInput.value;
        console.log("Username:" + chosenUserName);
        pureWebSocketClient.checkChosenUsernameAndCreateLoginRequest(chosenUserName);
    }
    else {
        console.error("UI element missing: Loginname Input field");
    }
}

function sendMessageToServer() {
    console.log("sending message");
    let messageToSend: FudgeNetwork.NetworkMessageMessageToServer = new FudgeNetwork.NetworkMessageMessageToServer(pureWebSocketClient.getLocalClientId(), FudgeNetwork.UiElementHandler.msgInput.value);
    pureWebSocketClient.sendMessageToSignalingServer(messageToSend);
}

function switchServerMode(): void {
    let switchbutton: HTMLButtonElement = FudgeNetwork.UiElementHandler.switchModeButton as HTMLButtonElement;
    if (!isServer) {
        switchbutton.textContent = "Switch to Clientmode";
        FudgeNetwork.UiElementHandler.signalingElements.style.display = "none";
        FudgeNetwork.UiElementHandler.serverElements.style.display = "block";
        isServer = true;
    }
    else {
        switchbutton.textContent = "Switch to Servermode";
        FudgeNetwork.UiElementHandler.signalingElements.style.display = "block";
        FudgeNetwork.UiElementHandler.serverElements.style.display = "none";
        isServer = false;
    }
}