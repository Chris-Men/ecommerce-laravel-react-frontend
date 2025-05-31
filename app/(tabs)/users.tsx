import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const API_URL = 'http://localhost:8000/api/admin/users';

export default function UserManagement() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 140 : 180;

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const routes = [
    { path: '/admins', label: 'Admins' },
    { path: '/brands', label: 'Brands' },
    { path: '/categories', label: 'Categories' },
    { path: '/colors', label: 'Colors' },
    { path: '/coupons', label: 'Coupons' },
    { path: '/orders', label: 'Orders' },
    { path: '/products', label: 'Products' },
    { path: '/reviews', label: 'Reviews' },
    { path: '/sizes', label: 'Sizes' },
    { path: '/users', label: 'Users' },
  ] as const;

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener usuarios');
      }

      const sortedUsers = data.users.sort((a: User, b: User) => a.id - b.id);
      setUsers(sortedUsers);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '' });
    setModalVisible(true);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '' });
    setModalVisible(false);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    if (form.name.trim() === '' || form.email.trim() === '') {
      Alert.alert('Validación', 'El nombre y email son obligatorios.');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          password_confirmation: form.password || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessMessage('Usuario actualizado con éxito');
        fetchUsers();
        cancelEditing();
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar usuario');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }]}>
          <View style={styles.logoDetails}>
            <Text style={styles.logoText}>🛒 MyStore</Text>
          </View>
          <ScrollView style={styles.navLinks}>
            {routes.map((route) => (
              <Link
                href={route.path}
                key={route.path}
                style={styles.linkContainer}
                asChild
              >
                <TouchableOpacity>
                  <Text style={styles.navLinkText}>{route.label}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>

        {/* Main content */}
        <View style={styles.homeSection}>
          <Text style={styles.welcomeText}>👥 Usuarios</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: '#fff' }]}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#11101d' },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 14, color: '#666', marginBottom: 2 },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      📧 {item.email}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 14, color: '#666', marginBottom: 2 },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      🆔 ID: {item.id}
                    </Text>
                    <Text
                      style={[
                        { 
                          fontSize: 14, 
                          color: item.role === 'admin' ? '#4e8cff' : '#28a745',
                          fontWeight: '500'
                        },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      👤 {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => startEditing(item)}>
                      <Text style={{ color: '#4e8cff', fontWeight: '500' }}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Modal editar usuario */}
          <Modal animationType="fade" transparent visible={modalVisible}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  isWeb
                    ? { width: 350 } // un poco más ancho para los campos del usuario
                    : { width: '90%' }, // ancho móvil
                ]}
              >
                <Text style={styles.modalTitle}>Editar Usuario</Text>
                
                <TextInput
                  placeholder="Nombre"
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
                
                <TextInput
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  style={styles.input}
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <TextInput
                  placeholder="Nueva contraseña (opcional)"
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  style={styles.input}
                  placeholderTextColor="#888"
                  secureTextEntry
                />
                
                <View style={styles.modalButtons}>
                  <Button title="Actualizar" onPress={updateUser} />
                  <Button
                    title="Cancelar"
                    color="gray"
                    onPress={cancelEditing}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },

  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 18,
  },
  homeSection: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#11101d',
    marginBottom: 20,
  },

  card: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  successMessageContainer: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  successMessageText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});