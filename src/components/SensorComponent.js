import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const SensorComponent = () => {
  const [accelData, setAccelData] = useState({});
  const [gyroData, setGyroData] = useState({});

  useEffect(() => {
    // Set update interval (ms)
    setUpdateIntervalForType(SensorTypes.accelerometer, 500);
    setUpdateIntervalForType(SensorTypes.gyroscope, 500);

    const accelSubscription = accelerometer.subscribe(
      ({x, y, z, timestamp}) => {
        setAccelData({x, y, z, timestamp});
      },
    );

    const gyroSubscription = gyroscope.subscribe(({x, y, z, timestamp}) => {
      setGyroData({x, y, z, timestamp});
    });

    return () => {
      accelSubscription.unsubscribe();
      gyroSubscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.textStyle}>
        Accelerometer: {JSON.stringify(accelData)}
      </Text>
      <Text style={styles.textStyle}>
        Gyroscope: {JSON.stringify(gyroData)}
      </Text>
    </View>
  );
};

export default SensorComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    color: 'white',
    fontSize: 14,
  },
});
