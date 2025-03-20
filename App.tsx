import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import SensorComponent from './src/components/SensorComponent'
import FallDetection from './src/components/FallDetection'
import GyroscopeSensor from './src/components/GyroscopeSensor'
import FallAndRotationDetection from './src/components/FallAndRotationDetection'

const App = () => {
  useEffect(()=>{
    requestPermissions()
  },[])

    const  requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Sensor permission granted.');
          } else {
            Alert.alert('Sensor permission denied.');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }

  return (
    <View  style={styles.container}>
      {/* <SensorComponent/> */}
      {/* <GyroscopeSensor/> */}
      <FallAndRotationDetection/>
      
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container:{
    flex:1
  }
})