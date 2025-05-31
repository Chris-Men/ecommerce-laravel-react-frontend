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

type Size = {
  id: number;
  name: string;
};

const API_URL = 'http://localhost:8000/api/admin/sizes';

export default function SizesPage() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 140 : 180;

  const [sizes, setSizes] = useState<Size[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<number | null>(null);
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

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener tallas');
      }

      const sortedSizes = data.sizes.sort((a: Size, b: Size) => a.id - b.id);
      setSizes(sortedSizes);
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

  const handleSubmit = async () => {
    if (name.trim() === '') {
      Alert.alert('Validación', 'El nombre no puede estar vacío.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccessMessage(editingId ? 'Talla actualizada con éxito' : 'Talla agregada con éxito');
        setName('');
        setEditingId(null);
        setModalVisible(false);
        fetchSizes();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar la talla');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar la talla');
    }
  };

  const handleDelete = async () => {
    if (sizeToDelete === null) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${sizeToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        showSuccessMessage('Talla eliminada con éxito');
        fetchSizes();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar la talla');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo eliminar la talla');
    } finally {
      setConfirmDeleteVisible(false);
      setSizeToDelete(null);
    }
  };

  const handleEdit = (size: Size) => {
    setName(size.name);
    setEditingId(size.id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchSizes();
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
          <Text style={styles.welcomeText}>📏 Tallas</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.linkContainer, { backgroundColor: '#4e8cff', marginBottom: 15, paddingVertical: 12 }]}
            onPress={() => {
              setEditingId(null);
              setName('');
              setModalVisible(true);
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>+ Nueva Talla</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={sizes}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: '#fff' }]}>
                  <Text
                    style={[
                      { fontSize: 16, fontWeight: '500', marginBottom: 8 },
                      isMobile ? { marginLeft: 20 } : {},
                    ]}
                  >
                    {item.name}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
                      <Text style={{ color: '#4e8cff' }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSizeToDelete(item.id);
                        setConfirmDeleteVisible(true);
                      }}
                    >
                      <Text style={{ color: '#ff4e4e' }}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Modal agregar/editar */}
          <Modal animationType="fade" transparent visible={modalVisible}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  isWeb
                    ? { width: 300 } // mismo ancho que modal eliminar en web
                    : { width: '85%' }, // ancho móvil
                ]}
              >
                <Text style={styles.modalTitle}>{editingId ? 'Editar Talla' : 'Agregar Talla'}</Text>
                <TextInput
                  placeholder="Nombre de la talla"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
                <View style={styles.modalButtons}>
                  <Button title={editingId ? 'Actualizar' : 'Guardar'} onPress={handleSubmit} />
                  <Button
                    title="Cancelar"
                    color="gray"
                    onPress={() => {
                      setModalVisible(false);
                      setName('');
                      setEditingId(null);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal confirmación eliminación */}
          <Modal animationType="fade" transparent visible={confirmDeleteVisible}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  isWeb
                    ? { width: 300 }
                    : { width: '85%' },
                ]}
              >
                <Text style={styles.modalTitle}>¿Eliminar talla?</Text>
                <Text style={{ marginBottom: 15 }}>
                  ¿Estás seguro de que deseas eliminar esta talla?
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="Eliminar" onPress={handleDelete} color="red" />
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setConfirmDeleteVisible(false);
                      setSizeToDelete(null);
                    }}
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
    // ancho y padding ajustados para web/mobile con inline styles en componente
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
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