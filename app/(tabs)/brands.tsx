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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Brand = {
  id: number;
  name: string;
};

const API_URL = 'http://localhost:8000/api/admin/brands';

export default function BrandsPage() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180 (igual que index)
  const SIDEBAR_WIDTH = isWeb ? 200 : 180;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<number | null>(null);
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

  const fetchBrands = async () => {
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

      if (!res.ok) throw new Error(data.message || 'Error al obtener marcas');

      const sortedBrands = data.brands.sort((a: Brand, b: Brand) => a.id - b.id);
      setBrands(sortedBrands);
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
    if (name.trim() === '') return Alert.alert('Validación', 'El nombre no puede estar vacío.');

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
        showSuccessMessage(editingId ? 'Marca actualizada con éxito' : 'Marca agregada con éxito');
        setName('');
        setEditingId(null);
        setModalVisible(false);
        fetchBrands();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la marca');
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${brandToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('Marca eliminada con éxito');
        fetchBrands();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar');
      }
    } finally {
      setConfirmDeleteVisible(false);
      setBrandToDelete(null);
    }
  };

  const handleEdit = (brand: Brand) => {
    setName(brand.name);
    setEditingId(brand.id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container]}>
        {/* Sidebar - exactamente igual al del index */}
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
          <Text style={styles.welcomeText}>📦 Marcas</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.linkContainer, { backgroundColor: '#4e8cff', marginBottom: 15, paddingVertical: 12, width: 200 }]}
            onPress={() => {
              setEditingId(null);
              setName('');
              setModalVisible(true);
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>+ Nueva Marca</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={brands}
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
                        setBrandToDelete(item.id);
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
                <Text style={styles.modalTitle}>{editingId ? 'Editar Marca' : 'Agregar Marca'}</Text>
                <TextInput
                  placeholder="Nombre de la marca"
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

          {/* Modal confirmación eliminar */}
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
                <Text style={styles.modalTitle}>¿Eliminar marca?</Text>
                <Text style={{ marginBottom: 15 }}>
                  ¿Estás seguro de que deseas eliminar esta marca?
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="Eliminar" onPress={handleDelete} color="red" />
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setConfirmDeleteVisible(false);
                      setBrandToDelete(null);
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Cambiado para coincidir con index
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa', // Cambiado para coincidir con index
  },
  // Sidebar styling exactamente igual al index
  sidebar: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#11101d',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoDetails: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1d1b31',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  navLinks: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  linkContainer: {
    backgroundColor: '#1d1b31',
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  homeSection: {
    flex: 1,
    padding: Platform.OS === 'web' ? 30 : 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
  },

  card: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    marginEnd: 10,
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