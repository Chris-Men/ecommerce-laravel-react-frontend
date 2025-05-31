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

type Coupon = {
  id: number;
  name: string;
  discount: number;
  valid_until?: string;
};

const API_URL = 'http://localhost:8000/api/admin/coupons';

export default function CouponsPage() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 140 : 180;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);
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

  const fetchCoupons = async () => {
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

      if (!res.ok) throw new Error(data.message || 'Error al obtener cupones');

      const sortedCoupons = data.coupons.sort((a: Coupon, b: Coupon) => a.id - b.id);
      setCoupons(sortedCoupons);
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
    if (!name || !discount) return Alert.alert('Validación', 'Todos los campos son obligatorios.');

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
        body: JSON.stringify({
          name,
          discount,
          valid_until: validUntil || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccessMessage(editingId ? 'Cupón actualizado con éxito' : 'Cupón agregado con éxito');
        resetForm();
        fetchCoupons();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar el cupón');
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${couponToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('Cupón eliminado con éxito');
        fetchCoupons();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar');
      }
    } finally {
      setConfirmDeleteVisible(false);
      setCouponToDelete(null);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setName(coupon.name);
    setDiscount(coupon.discount.toString());
    setValidUntil(coupon.valid_until || '');
    setEditingId(coupon.id);
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setDiscount('');
    setValidUntil('');
    setEditingId(null);
    setModalVisible(false);
  };

  useEffect(() => {
    fetchCoupons();
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
          <Text style={styles.welcomeText}>🎟️ Cupones</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.linkContainer, { backgroundColor: '#4e8cff', marginBottom: 15, paddingVertical: 12 }]}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>+ Nuevo Cupón</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={coupons}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isExpired = item.valid_until && new Date(item.valid_until) < new Date();

                return (
                  <View style={[styles.card, { backgroundColor: '#fff' }]}>
                    <Text
                      style={[
                        { fontSize: 16, fontWeight: '500', marginBottom: 8 },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>Descuento: {item.discount}</Text>
                    <Text style={{ marginBottom: 8 }}>
                      Expira:{' '}
                      {item.valid_until
                        ? `${item.valid_until} (${isExpired ? 'Expirado' : 'Vigente'})`
                        : 'Sin fecha'}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
                        <Text style={{ color: '#4e8cff' }}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setCouponToDelete(item.id);
                          setConfirmDeleteVisible(true);
                        }}
                      >
                        <Text style={{ color: '#ff4e4e' }}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
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
                <Text style={styles.modalTitle}>{editingId ? 'Editar Cupón' : 'Agregar Cupón'}</Text>
                <TextInput
                  placeholder="Nombre del cupón"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder="Descuento"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder="Fecha de expiración (opcional)"
                  value={validUntil}
                  onChangeText={setValidUntil}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
                <View style={styles.modalButtons}>
                  <Button title={editingId ? 'Actualizar' : 'Guardar'} onPress={handleSubmit} />
                  <Button
                    title="Cancelar"
                    color="gray"
                    onPress={resetForm}
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
                <Text style={styles.modalTitle}>¿Eliminar cupón?</Text>
                <Text style={{ marginBottom: 15 }}>
                  ¿Estás seguro de que deseas eliminar este cupón?
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="Eliminar" onPress={handleDelete} color="red" />
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setConfirmDeleteVisible(false);
                      setCouponToDelete(null);
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