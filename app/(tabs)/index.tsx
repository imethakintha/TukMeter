import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, SafeAreaView, TouchableOpacity, Keyboard, Alert } from 'react-native';


const FIRST_KM_RATE = 100; 
const NEXT_KM_RATE = 80;  

export default function TukMeterApp() {

  const [distance, setDistance] = useState('');
 
  const [fare, setFare] = useState<number | null>(null);

  
  const handleCalculateFare = () => {
    Keyboard.dismiss();
    const distanceNum = parseFloat(distance); 

    
    if (isNaN(distanceNum) || distanceNum <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid distance in kilometers.");
      setFare(null);
      return;
    }

    let calculatedFare = 0;
    if (distanceNum <= 1) {
      calculatedFare = FIRST_KM_RATE;
    } else {
      calculatedFare = FIRST_KM_RATE + (distanceNum - 1) * NEXT_KM_RATE;
    }
    
    setFare(calculatedFare);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tuk Meter (ටුක් මීටරය)</Text>
        <Text style={styles.subtitle}>Estimate your tuk-tuk fare</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter distance (in km)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.5"
          keyboardType="decimal-pad"
          value={distance}
          onChangeText={setDistance}
        />
        <TouchableOpacity style={styles.button} onPress={handleCalculateFare}>
          <Text style={styles.buttonText}>Calculate Fare</Text>
        </TouchableOpacity>

        {fare !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Estimated Fare:</Text>
            <Text style={styles.resultFare}>Rs. {fare.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffc107', // Tuk-tuk yellow
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    height: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultLabel: {
    fontSize: 20,
    color: '#555',
  },
  resultFare: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
});