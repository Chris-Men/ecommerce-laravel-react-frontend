// LoginScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const API_URL = 'http://localhost:8000/api/admin/login';

const LoginScreen = () => {
  const [email, setEmail] = useState('superadmin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(API_URL, {
        email,
        password
      });

      const accessToken = response.data.access_token;
      const userName = response.data.name;
      setError('');

      if (accessToken) {
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('userName', userName);
        router.replace('/(tabs)');
      } else {
        setError('Error al obtener el token');
      }
    } catch (err: any) {
      console.error('Error en el inicio de sesión:', err);
      setError('Credenciales inválidas o error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Background with decorative elements */}
      <View style={styles.background}>
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.circle4} />
        
        <View style={styles.content}>
          {/* Left side - Welcome section */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={styles.logoIcon} />
                <View style={styles.logoIcon2} />
              </View>
            </View>
            
            <Text style={styles.welcomeTitle}>Hola de nuevo</Text>
            <View style={styles.titleUnderline} />
            
            <Text style={styles.welcomeSubtitle}>
             Desde aquí puedes gestionar tus productos, revisar pedidos 
  y mantener tu tienda al día. ¡Vamos a trabajar!
            </Text>
            
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>EMPEZAR</Text>
            </TouchableOpacity>
          </View>

          {/* Right side - Login form */}
          <View style={styles.rightSection}>
            <View style={styles.loginCard}>
              <Text style={styles.signInTitle}>Iniciar sesión</Text>
              
              {/* User Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de usuario</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#B8A4C9"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#B8A4C9"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.submitText}>
                  {isLoading ? 'Iniciando sesión...' : 'Enviar'}
                </Text>
              </TouchableOpacity>

              {/* Social Login Icons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>📌</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a', // Azul oscuro
  },
  background: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1e3a8a', // Azul oscuro
  },
  // Decorative circles
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    left: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: height * 0.3,
    right: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    bottom: height * 0.2,
    left: 50,
  },
  circle4: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -20,
    right: width * 0.3,
  },
  content: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: 20,
    paddingVertical: 20, // Reducido de 40 a 20
    paddingTop: Platform.OS === 'ios' ? 0 : 20, // Menos padding superior
  },
  leftSection: {
    flex: Platform.OS === 'web' ? 1 : 0.35, // Reducido de 0.4 a 0.35
    justifyContent: 'center',
    paddingRight: Platform.OS === 'web' ? 40 : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 15, // Reducido de 30 a 15
  },
  logoContainer: {
    marginBottom: 20, // Reducido de 40 a 20
  },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logoIcon: {
    width: 12,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginRight: 3,
  },
  logoIcon2: {
    width: 8,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  welcomeTitle: {
    fontSize: 36, // Reducido de 48 a 36
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8, // Reducido de 10 a 8
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#3b82f6', // Azul más suave
    marginBottom: 15, // Reducido de 30 a 15
  },
  welcomeSubtitle: {
    fontSize: 14, // Reducido de 16 a 14
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20, // Reducido de 24 a 20
    marginBottom: 20, // Reducido de 40 a 20
  },
  learnMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rightSection: {
    flex: Platform.OS === 'web' ? 1 : 0.65, // Aumentado de 0.6 a 0.65
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)', // Azul suave con transparencia
    borderRadius: 20,
    padding: 30, // Reducido de 40 a 30
    width: Platform.OS === 'web' ? 380 : '100%',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)', // Azul claro para el borde
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  signInTitle: {
    fontSize: 28, // Reducido de 32 a 28
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30, // Reducido de 40 a 30
  },
  inputGroup: {
    marginBottom: 20, // Reducido de 25 a 20
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    paddingRight: 16,
  },
  eyeText: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 25, // Reducido de 30 a 25
    borderRadius: 25,
    backgroundColor: '#3b82f6', // Azul más suave
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#1e40af', // Azul más oscuro para disabled
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  socialIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;