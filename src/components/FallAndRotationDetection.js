import React, {Component} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {map, filter} from 'rxjs/operators';
import axios from 'axios';

class FallAndRotationDetection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accelData: {x: 0, y: 0, z: 0, magnitude: 0},
      gyroData: {x: 0, y: 0, z: 0, speed: 0},
      fallLogs: [],
    };
    this.accelSubscription = null;
    this.gyroSubscription = null;
    this.fallDetected = false;
  }

  async componentDidMount() {
    await this.requestPermissions();

    // Set update intervals
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);
    setUpdateIntervalForType(SensorTypes.gyroscope, 250);

    // Accelerometer subscription (Fall Detection)
    this.accelSubscription = accelerometer
      .pipe(
        map(({x, y, z}) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          return {x, y, z, magnitude};
        }),
        filter(({magnitude}) => magnitude > 0),
      )
      .subscribe(
        data => this.handleAcceleration(data),
        error => console.log('Accelerometer error:', error),
      );

    // Gyroscope subscription (Rotation Detection)
    this.gyroSubscription = gyroscope
      .pipe(
        map(({x, y, z}) => {
          const speed = Math.sqrt(x * x + y * y + z * z);
          const alpha = 0.1; // Low-pass filter
          const prev = this.state.gyroData;
          return {
            x: alpha * x + (1 - alpha) * prev.x,
            y: alpha * y + (1 - alpha) * prev.y,
            z: alpha * z + (1 - alpha) * prev.z,
            speed: alpha * speed + (1 - alpha) * prev.speed,
          };
        }),
      )
      .subscribe(
        data => this.handleGyroData(data),
        error => console.log('Gyroscope error:', error),
      );
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Sensor permissions granted.');
        } else {
          console.log('❌ Sensor permissions denied.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  componentWillUnmount() {
    if (this.accelSubscription) this.accelSubscription.unsubscribe();
    if (this.gyroSubscription) this.gyroSubscription.unsubscribe();
  }

  handleAcceleration = ({x, y, z, magnitude}) => {
    this.setState({accelData: {x, y, z, magnitude}});

    const lowThreshold = 0.5;
    const highThreshold = 2.0;
    const resetThreshold = 1.0;

    if (!this.fallDetected && magnitude < lowThreshold) {
      this.fallDetected = true;
    }

    if (this.fallDetected && magnitude > highThreshold) {
      this.logFallEvent();
      this.showFallAlert();
      this.fallDetected = false;
    }

    if (
      this.fallDetected &&
      magnitude > resetThreshold &&
      magnitude < highThreshold
    ) {
      this.fallDetected = false;
    }
  };

  handleGyroData = ({x, y, z, speed}) => {
    if (Math.abs(x) < 0.05) x = 0;
    if (Math.abs(y) < 0.05) y = 0;
    if (Math.abs(z) < 0.05) z = 0;

    this.setState({gyroData: {x, y, z, speed}});

    console.log(
      `📊 Gyro Data: X=${x.toFixed(2)}, Y=${y.toFixed(2)}, Z=${z.toFixed(
        2,
      )}, Speed=${speed.toFixed(2)}`,
    );

    if (speed > 3.0) {
      console.log('🚀 Fast rotation detected!');
    }
  };

  logFallEvent = async () => {
    const timestamp = new Date().toISOString();
    const newLog = {timestamp};
    this.setState(prevState => ({
      fallLogs: [...prevState.fallLogs, newLog],
    }));

    console.log('📢 Fall detected at:', timestamp);

    try {
      await axios.post('https://your-api-endpoint.com/fall-event', {
        userId: 'user123',
        fallTime: timestamp,
      });
      console.log('✅ Fall event logged to server.');
    } catch (error) {
      console.log('❌ API Error:', error.message);
    }
  };

  showFallAlert = () => {
    Alert.alert(
      '⚠️ Fall Detected!',
      'Are you okay? Please respond.',
      [
        {text: "I'm Okay", onPress: () => console.log('User is okay')},
        {text: 'Need Help', onPress: () => console.log('Help requested')},
      ],
      {cancelable: false},
    );
  };

  render() {
    const {x, y, z, magnitude} = this.state.accelData;
    const {x: gx, y: gy, z: gz, speed} = this.state.gyroData;

    return (
      <View style={styles.container}>
        <Text style={styles.header}>📌 Accelerometer Data:</Text>
        <Text>X: {x.toFixed(2)}</Text>
        <Text>Y: {y.toFixed(2)}</Text>
        <Text>Z: {z.toFixed(2)}</Text>
        <Text>Magnitude: {magnitude.toFixed(2)}</Text>

        <Text style={styles.header}>📌 Gyroscope Data:</Text>
        <Text>X: {gx.toFixed(2)} rad/s</Text>
        <Text>Y: {gy.toFixed(2)} rad/s</Text>
        <Text>Z: {gz.toFixed(2)} rad/s</Text>
        <Text>Speed: {speed.toFixed(2)} rad/s</Text>

        {/* <Text style={styles.header}>📌 Fall Logs:</Text> */}
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

export default FallAndRotationDetection;
