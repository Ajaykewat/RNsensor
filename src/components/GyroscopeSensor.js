import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {map} from 'rxjs/operators';

class GyroscopeSensor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gyroData: {x: 0, y: 0, z: 0, speed: 0},
    };
    this.gyroSubscription = null;
  }

  async componentDidMount() {
    await this.requestGyroPermissions();

    // Set update interval to 250ms (reduce noise)
    setUpdateIntervalForType(SensorTypes.gyroscope, 250);

    // Subscribe to gyroscope data
    this.gyroSubscription = gyroscope
      .pipe(
        map(({x, y, z}) => {
          const speed = Math.sqrt(x * x + y * y + z * z);

          // Apply Low-Pass Filter (smooths out noise)
          const alpha = 0.1;
          const prevState = this.state.gyroData;

          return {
            x: alpha * x + (1 - alpha) * prevState.x,
            y: alpha * y + (1 - alpha) * prevState.y,
            z: alpha * z + (1 - alpha) * prevState.z,
            speed: alpha * speed + (1 - alpha) * prevState.speed,
          };
        }),
      )
      .subscribe(
        data => this.handleGyroData(data),
        error => console.log('Gyroscope error:', error),
      );
  }

  async requestGyroPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Gyroscope permission granted.');
        } else {
          console.log('❌ Gyroscope permission denied.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  componentWillUnmount() {
    if (this.gyroSubscription) {
      this.gyroSubscription.unsubscribe();
    }
  }

  handleGyroData = ({x, y, z, speed}) => {
    // Ignore small fluctuations (noise threshold)
    if (Math.abs(x) < 0.05) x = 0;
    if (Math.abs(y) < 0.05) y = 0;
    if (Math.abs(z) < 0.05) z = 0;

    this.setState({gyroData: {x, y, z, speed}});

    console.log(
      `📊 Gyro Data: X=${x.toFixed(2)}, Y=${y.toFixed(2)}, Z=${z.toFixed(
        2,
      )}, Speed=${speed.toFixed(2)}`,
    );

    // Example: Detect a fast rotation
    if (speed > 3.0) {
      console.log('🚀 Fast rotation detected!');
    }
  };

  render() {
    const {x, y, z, speed} = this.state.gyroData;

    return (
      <View style={styles.container}>
        <Text style={styles.header}>📌 Gyroscope Data:</Text>
        <Text>X: {x.toFixed(2)} rad/s</Text>
        <Text>Y: {y.toFixed(2)} rad/s</Text>
        <Text>Z: {z.toFixed(2)} rad/s</Text>
        <Text>Speed: {speed.toFixed(2)} rad/s</Text>
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

export default GyroscopeSensor;
