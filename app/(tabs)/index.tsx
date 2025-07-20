import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, AppState } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';

const FIRST_KM_RATE = 100;
const NEXT_KM_RATE = 80;
const WAITING_RATE_PER_MINUTE = 4;

function getDistance(from: Location.LocationObjectCoords, to: Location.LocationObjectCoords) {
  const R = 6371; 
  const dLat = (to.latitude - from.latitude) * (Math.PI / 180);
  const dLon = (to.longitude - from.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.latitude * (Math.PI / 180)) * Math.cos(to.latitude * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return distance;
}

export default function TukMeterLiveApp() {
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  
  const [pathCoordinates, setPathCoordinates] = useState<Location.LocationObjectCoords[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0); 
  const [fare, setFare] = useState(0);

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const waitingTimer = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the app.');
      }
    })();
  }, []);

  useEffect(() => {
    if (isWaiting) {
      waitingTimer.current = setInterval(() => {
        setWaitingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (waitingTimer.current) {
        clearInterval(waitingTimer.current);
      }
    }
    return () => {
      if (waitingTimer.current) clearInterval(waitingTimer.current);
    };
  }, [isWaiting]);

  useEffect(() => {
    let distanceFare = 0;
    if (totalDistance > 0) {
      if (totalDistance <= 1) {
        distanceFare = FIRST_KM_RATE;
      } else {
        distanceFare = FIRST_KM_RATE + (totalDistance - 1) * NEXT_KM_RATE;
      }
    }
    const waitingFare = (waitingTime / 60) * WAITING_RATE_PER_MINUTE;
    setFare(distanceFare + waitingFare);
  }, [totalDistance, waitingTime]);


  const startJourney = async () => {
    
    setPathCoordinates([]);
    setTotalDistance(0);
    setWaitingTime(0);
    setFare(0);
    setIsWaiting(false);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000, 
        distanceInterval: 10, 
      },
      (location) => {
        setPathCoordinates(prevCoords => {
          const newCoords = [...prevCoords, location.coords];
          if (newCoords.length > 1) {
            const lastPoint = newCoords[newCoords.length - 2];
            const newPoint = newCoords[newCoords.length - 1];
            const distanceIncrement = getDistance(lastPoint, newPoint);
            setTotalDistance(prevDist => prevDist + distanceIncrement);
          }
          return newCoords;
        });
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    );
    setIsJourneyActive(true);
  };

  const stopJourney = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setIsJourneyActive(false);
    setIsWaiting(false);
  };

  const toggleWaiting = () => {
    setIsWaiting(prevState => !prevState);
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Polyline coordinates={pathCoordinates} strokeColor="#1e90ff" strokeWidth={6} />
      </MapView>

      <View style={styles.bottomContainer}>
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{totalDistance.toFixed(2)} km</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Waiting Time</Text>
            <Text style={styles.infoValue}>{Math.floor(waitingTime / 60)}m {waitingTime % 60}s</Text>
          </View>
        </View>
        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>TOTAL FARE</Text>
          <Text style={styles.fareValue}>Rs. {fare.toFixed(2)}</Text>
        </View>
        <View style={styles.buttonContainer}>
          {!isJourneyActive ? (
            <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startJourney}>
              <Text style={styles.buttonText}>Start Journey</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.button, isWaiting ? styles.resumeButton : styles.waitButton]} onPress={toggleWaiting}>
                <Text style={styles.buttonText}>{isWaiting ? 'Resume Ride' : 'Start Waiting'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopJourney}>
                <Text style={styles.buttonText}>Stop Journey</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  fareBox: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffc107',
    borderRadius: 10,
  },
  fareLabel: {
    fontSize: 16,
    color: '#333',
  },
  fareValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
  },
  startButton: {
    backgroundColor: '#28a745', 
  },
  stopButton: {
    backgroundColor: '#dc3545', 
  },
  waitButton: {
    backgroundColor: '#ffc107', 
    marginRight: 8,
  },
  resumeButton: {
    backgroundColor: '#17a2b8', 
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});