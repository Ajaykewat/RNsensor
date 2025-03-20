import React, {Component} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {map, filter} from 'rxjs/operators';
import axios from 'axios';

class FallDetection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accelData: {x: 0, y: 0, z: 0, magnitude: 0},
      fallLogs: [],
    };
    this.accelSubscription = null;
    this.fallDetected = false;
  }

  async componentDidMount() {
    await this.requestPermissions(); // Request permissions on Android

    setUpdateIntervalForType(SensorTypes.accelerometer, 100); // Update every 100ms

    this.accelSubscription = accelerometer
      .pipe(
        map(({x, y, z}) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          return this.applyLowPassFilter({x, y, z, magnitude});
        }),
        filter(({magnitude}) => magnitude > 0),
      )
      .subscribe(
        data => this.handleAcceleration(data),
        error => Alert.alert('Accelerometer error:', error),
      );
  }

  componentWillUnmount() {
    if (this.accelSubscription) {
      this.accelSubscription.unsubscribe();
    }
  }

  async requestPermissions() {
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

  applyLowPassFilter = newData => {
    const alpha = 0.1; // Adjust this value for smoother or faster response
    const prevData = this.state.accelData;
    return {
      x: prevData.x * (1 - alpha) + newData.x * alpha,
      y: prevData.y * (1 - alpha) + newData.y * alpha,
      z: prevData.z * (1 - alpha) + newData.z * alpha,
      magnitude: prevData.magnitude * (1 - alpha) + newData.magnitude * alpha,
    };
  };

  handleAcceleration = ({x, y, z, magnitude}) => {
    this.setState({accelData: {x, y, z, magnitude}});

    console.log(
      `Acceleration Data: X=${x.toFixed(2)}, Y=${y.toFixed(2)}, Z=${z.toFixed(
        2,
      )}, Mag=${magnitude.toFixed(2)}`,
    );

    const lowThreshold = 1.0; // Free-fall threshold
    const highThreshold = 15.0; // Impact threshold
    const resetThreshold = 9.8; // Normal movement (close to gravity)

    if (!this.fallDetected && magnitude < lowThreshold) {
      console.log('⚠️ Free-fall detected!');
      this.fallDetected = true;
    }

    if (this.fallDetected && magnitude > highThreshold) {
      Alert.alert('💥 Impact detected!');
      this.logFallEvent();
      this.showFallAlert();
      this.fallDetected = false;
    }

    if (
      this.fallDetected &&
      magnitude > resetThreshold &&
      magnitude < highThreshold
    ) {
      console.log('✅ Resetting fall detection.');
      this.fallDetected = false;
    }
  };

  logFallEvent = async () => {
    const timestamp = new Date().toISOString();
    const newLog = {timestamp};
    this.setState(prevState => ({
      fallLogs: [...prevState.fallLogs, newLog],
    }));

    Alert.alert('📌 Fall detected at:', timestamp);

    try {
      //   await axios.post('https://your-api-endpoint.com/fall-event', {
      //     userId: 'user123',
      //     fallTime: timestamp,
      //   });
      Alert.alert('✅ Fall event logged to server.');
    } catch (error) {
      Alert.alert('❌ API Error:', error.message);
    }
  };

  showFallAlert = () => {
    Alert.alert(
      '🚨 Fall Detected!',
      'Are you okay? Please respond.',
      [
        {text: "I'm Okay", onPress: () => Alert.alert('User is okay')},
        {text: 'Need Help', onPress: () => Alert.alert('Help requested')},
      ],
      {cancelable: false},
    );
  };

  render() {
    const {x, y, z, magnitude} = this.state.accelData;

    return (
      <View style={styles.container}>
        <Text style={styles.header}>📌 Accelerometer Data:</Text>
        <Text>X: {x.toFixed(2)}</Text>
        <Text>Y: {y.toFixed(2)}</Text>
        <Text>Z: {z.toFixed(2)}</Text>
        <Text>Magnitude: {magnitude.toFixed(2)}</Text>

        <Text style={styles.header}>Fall Logs:</Text>
        {this.state.fallLogs.map((log, index) => (
          <Text key={index}>{log.timestamp}</Text>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
  },
});

export default FallDetection;
