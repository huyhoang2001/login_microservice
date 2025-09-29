import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { testAllConnections } from '../utils/networkTest';
import { authAPI } from '../api/auth';

export default function NetworkTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runAllTests = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🧪 Running comprehensive network tests...');
      
      // Test 1: Basic connectivity
      const connectResults = await testAllConnections();
      
      // Test 2: API functionality
      const apiTest = await authAPI.testConnection();
      
      setResults({
        connectivity: connectResults,
        apiWorking: apiTest,
        platform: Platform.OS,
        timestamp: new Date().toLocaleTimeString()
      });
      
    } catch (error) {
      setResults({
        error: error.message,
        platform: Platform.OS,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTesting(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <ScrollView style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results ({results.timestamp})</Text>
        <Text style={styles.platform}>Platform: {results.platform}</Text>
        
        {results.error && (
          <Text style={styles.error}>Error: {results.error}</Text>
        )}
        
        {results.connectivity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Tests:</Text>
            {Object.entries(results.connectivity).map(([name, result]) => (
              <Text key={name} style={[styles.testResult, result.success ? styles.success : styles.failure]}>
                {name}: {result.success ? '✅ Success' : `❌ ${result.error}`}
              </Text>
            ))}
          </View>
        )}
        
        {results.apiWorking !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Test:</Text>
            <Text style={[styles.testResult, results.apiWorking ? styles.success : styles.failure]}>
              API Connection: {results.apiWorking ? '✅ Working' : '❌ Failed'}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Diagnostic Tool</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: testing ? '#ccc' : '#007AFF' }]} 
        onPress={runAllTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Run Network Test'}
        </Text>
      </TouchableOpacity>
      
      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  results: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  platform: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  testResult: {
    fontSize: 13,
    marginVertical: 2,
  },
  success: {
    color: 'green',
  },
  failure: {
    color: 'red',
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});