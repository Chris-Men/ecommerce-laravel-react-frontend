import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userName');
    router.replace('/login');
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUserName(name);
      } else {
        console.log('No se encontró el nombre del usuario en AsyncStorage');
      }
    };
    fetchUserName();
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.logoDetails}>
          <ThemedText style={styles.logoText}>🛒 MyStore</ThemedText>
        </View>
        <ScrollView style={styles.navLinks}>
          <Link href="/admins" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Admins</ThemedText>
          </Link>
          <Link href="/brands" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Brands</ThemedText>
          </Link>
          <Link href="/categories" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Categories</ThemedText>
          </Link>
          <Link href="/colors" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Colors</ThemedText>
          </Link>
          <Link href="/coupons" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Coupons</ThemedText>
          </Link>
          <Link href="/orders" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Orders</ThemedText>
          </Link>
          <Link href="/products" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Products</ThemedText>
          </Link>
          <Link href="/reviews" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Reviews</ThemedText>
          </Link>
          <Link href="/sizes" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Sizes</ThemedText>
          </Link>
          <Link href="/users" style={styles.linkContainer}>
            <ThemedText style={styles.navLinkText}>Users</ThemedText>
          </Link>
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.homeSection}>
        <ThemedText style={styles.welcomeText}>¡Bienvenido {userName}!</ThemedText>
        <View style={{ marginVertical: 20, width: 200 }}>
          <Button title="Cerrar sesión" onPress={handleLogout} />
        </View>
      </View>
    </ThemedView>
  );
}

const SIDEBAR_WIDTH = 180;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Sidebar + contenido lado a lado
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#11101d',
    paddingTop: 20,
  },
  logoDetails: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  navLinks: {
    paddingLeft: 10,
  },
  linkContainer: {
    backgroundColor: '#1d1b31',
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Elevación para Android
    elevation: 5,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 18,
  },
  homeSection: {
    flex: 1,
    padding: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#11101d',
    marginBottom: 20,
  },
});