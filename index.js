/*
* @providesModule react-native-call-detection
*/
import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid
} from 'react-native'

export const permissionDenied = 'PERMISSION DENIED'

const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge')

const NativeCallDetector = NativeModules.CallDetectionManager
const NativeCallDetectorAndroid = NativeModules.CallDetectionManagerAndroid

var CallStateUpdateActionModule = require('./CallStateUpdateActionModule')
BatchedBridge.registerCallableModule('CallStateUpdateActionModule', CallStateUpdateActionModule)

const requestPermissionsAndroid = async (permissionMessage) => {
      let gotPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)
      if (gotPermission) {
        return true;
      } else {
        gotPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, permissionMessage);
        return gotPermission === PermissionsAndroid.RESULTS.GRANTED;
      }
}

export const CALL_STATE_IDLE = 0;
export const CALL_STATE_RINGING = 1;
export const CALL_STATE_OFFHOOK = 2;

class CallDetectorManager {

    subscription;
    callback

    startListener(callback, readPhoneNumberAndroid = false, permissionDeniedCallback = () => {}, permissionMessage = {
      title: 'Phone State Permission',
      message: 'This app needs access to your phone state in order to react and/or to adapt to incoming calls.'
    }) {
      this.callback = callback
      if (Platform.OS === 'ios') {
          NativeCallDetector && NativeCallDetector.startListener()
          this.subscription = new NativeEventEmitter(NativeCallDetector)
          this.subscription.addListener('PhoneCallStateUpdate', callback);
      }
      else {
          if(NativeCallDetectorAndroid) {
            if(readPhoneNumberAndroid) {
              requestPermissionsAndroid(permissionMessage)
                .then((permissionGranted) => {
                  if (!permissionGranted) {
                    permissionDeniedCallback(permissionDenied)
                  }
                })
                .catch(permissionDeniedCallback)
            }
            NativeCallDetectorAndroid.startListener();
          }
          CallStateUpdateActionModule.callback = callback
      }
    }

    dispose() {
    	NativeCallDetector && NativeCallDetector.stopListener()
    	NativeCallDetectorAndroid && NativeCallDetectorAndroid.stopListener()
        CallStateUpdateActionModule.callback = undefined
      if(this.subscription) {
          this.subscription.removeAllListeners('PhoneCallStateUpdate');
          this.subscription = undefined
      }
    }

    static getCallState() {
      if (Platform.OS === 'ios') {
        throw 'Not implemented';
      } else {
        return NativeCallDetectorAndroid.getCallState();
      }
    }

    static isListening() {
      if (Platform.OS === 'ios') {
        throw 'Not implemented';
      } else {
        return NativeCallDetectorAndroid.isListening();
      }
    }
}

export default CallDetectorManager;
