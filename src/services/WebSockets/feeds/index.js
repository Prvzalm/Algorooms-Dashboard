import Logger from "./logger";
import { getSubscriptionTopic, getSocketPublishObject } from "./utilities";
import { decodeMessage } from "./message";

export class Octopus {
  /**
   * @param {Object} [initParams={}]
   * @param {string} [initParams.host] - location.host
   * @param {string} [initParams.path] - e.g. '/mqtt'
   * @param {string} [initParams.loginId] - will auto generate some random string if not provided
   * @param {string} [initParams.userName] - can be used for auth, we are not using auth for mqtt as of now
   * @param {string} [initParams.password] - can be used for auth, we are not using auth for mqtt as of now
   *
   */
  constructor(initParams = {}) {
    const { host, path, loginId, token } = initParams;
    const protocol = window.location.protocol === "https:" ? "wss" : "wss";
    this.uri = `${protocol}://${host}${path}?login_id=${loginId}&token=${token}&device=web`;

    this._socket = null;
    this._reconnectionTimeout = 0;
    this._lastConnectedTimestamp = Date.now();
    this._topics = {};
    // this._maxCallbacksPerTopic = 10;
    this._sendHeartbeat = this._sendHeartbeat.bind(this);
    this.connect = this.connect.bind(this);
    this.wsHandler = this.wsHandler.bind(this);

    this._sendHeartbeat();
  }

  _sendHeartbeat() {
    setInterval(() => {
      if (this._socket && this._socket.readyState === WebSocket.OPEN) {
        this._socket.send('{"a":"h","v":[],"m":""}');
      }
    }, 9500);
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this.uri);
      this._socket.binaryType = "arraybuffer";

      this._socket.onopen = () => {
        resolve("socket connected");
        this._reconnectionTimeout = 0;
        try {
          Object.values(this._topics).forEach(({ subscriptionObj }) => {
            this._socket.send(subscriptionObj);
          });
        } catch (err) {
          console.log(err);
        }
      };

      this._socket.onmessage = (event) => {
        const buffer = event.data;
        // console.log(buffer, "Buffer");
        try {
          const message = decodeMessage(buffer);
          // console.log(message, "message");
          const topic = message.topic;
          const subscriptions = (this._topics[topic] || {}).subscriptions || [];
          subscriptions.forEach(({ callback }) => callback(message));
        } catch (error) {
          console.log(error);
        }
      };

      this._socket.onclose = () => {
        reject("socket connection closed");
        setTimeout(() => this.connect(), 1000);
      };

      this._socket.onerror = (err) => {
        Logger(`Socket encountered error: ${err.message}, closing socket`);
        this._socket.close();
      };
    });
  }

  wsHandler({ messageType, subscriptionLocation, payload, identifier }) {
    // console.log(messageType, payload, subscriptionLocation, identifier);
    const topic = getSubscriptionTopic({ messageType, payload });
    const partialSubscriptionObj = getSocketPublishObject({
      messageType,
      payload,
    });
    const subscriptionObj = JSON.stringify({
      ...partialSubscriptionObj,
      a: "subscribe",
    });
    const unsubscriptionObj = JSON.stringify({
      ...partialSubscriptionObj,
      a: "unsubscribe",
    });

    return {
      subscribe: (callback) => {
        return new Promise((resolve, reject) => {
          if (!this._topics[topic]) {
            this._topics[topic] = {
              subscriptionObj,
              subscriptions: [],
            };
          }
          const alreadySubscribed = Boolean(
            this._topics[topic].subscriptions.filter((obj) => obj.subscriptionLocation === subscriptionLocation).length
          );

          if (alreadySubscribed) {
            reject(`${messageType} already subscribed from ${subscriptionLocation}`);
            return;
          }

          if (this._socket && this._socket.readyState === WebSocket.OPEN) {
            // if (this._topics[topic].subscriptions.length === 0) {
            //   this._socket.send(unsubscriptionObj);
            // }
            this._socket.send(subscriptionObj);
            resolve("subscribed");
          } else {
            reject(`socket not connect, ${messageType} will be auto subscribed later`);
          }

          this._topics[topic].subscriptions.push({
            subscriptionLocation,
            callback,
          });
        });
      },
      unsubscribe: () => {
        return new Promise((resolve, reject) => {
          const subscriptions = (this._topics[topic] || []).subscriptions || [];
          const remainingSubscriptions = subscriptions.filter((obj) => obj.subscriptionLocation !== subscriptionLocation);

          if (remainingSubscriptions.length === subscriptions.length) {
            Logger(messageType, subscriptionLocation, payload);
            reject("subscription does not exists");
          } else {
            this._topics[topic].subscriptions = remainingSubscriptions;
            resolve("unsubscribed");
            if (remainingSubscriptions.length === 0 && this._socket) {
              this._socket.send(unsubscriptionObj);
            }
          }
        });
      },
      identifier,
    };
  }
}
