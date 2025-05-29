import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://localhost:8000/api/admin/coupons';

type Coupon = {
  id: number;
  name: string;
  discount: number;
  valid_until?: string;
};

export default function CouponsPage() {
  const navigation = useNavigation();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

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
      const json = await res.json();
      setCoupons(json.coupons);
    } catch (error: any) {
      console.error('Error al obtener cupones:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los cupones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !discount) {
      Alert.alert('Validación', 'Todos los campos son obligatorios.');
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
        body: JSON.stringify({
          name,
          discount,
          valid_until: validUntil || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(data.message || 'Cupón guardado con éxito');
        resetForm();
        fetchCoupons();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar el cupón');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'No se pudo guardar el cupón');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setName(coupon.name);
    setDiscount(coupon.discount.toString());
    setValidUntil(coupon.valid_until || '');
    setEditingId(coupon.id);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (couponToDelete === null) return;

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
        Alert.alert(data.message || 'Cupón eliminado');
        fetchCoupons();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar el cupón');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'No se pudo eliminar el cupón');
    } finally {
      setConfirmDeleteVisible(false);
      setCouponToDelete(null);
    }
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
    <SafeAreaView style={styles.container}>
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Agregar Cupón</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Listado de Cupones</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isExpired =
              item.valid_until && new Date(item.valid_until) < new Date();

            return (
              <View style={styles.card}>
                <Text style={styles.bold}>Nombre: {item.name}</Text>
                <Text>Descuento: {item.discount}</Text>
                <Text>
                  Expira:{' '}
                  {item.valid_until
                    ? `${item.valid_until} (${isExpired ? 'Expirado' : 'Vigente'})`
                    : 'Sin fecha'}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Text style={{ color: 'blue', marginRight: 10 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCouponToDelete(item.id);
                      setConfirmDeleteVisible(true);
                    }}
                  >
                    <Text style={{ color: 'red' }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal agregar/editar */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Editar Cupón' : 'Agregar Cupón'}
            </Text>

            <TextInput
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Descuento"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
              style={styles.input}
            />
            <TextInput
              placeholder="Fecha de expiración (opcional)"
              value={validUntil}
              onChangeText={setValidUntil}
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Button title={editingId ? 'Actualizar' : 'Guardar'} onPress={handleSubmit} />
              <Button title="Cancelar" color="gray" onPress={resetForm} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal eliminar */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>¿Eliminar cupón?</Text>
            <Text>¿Estás seguro de que deseas eliminar este cupón?</Text>
            <View style={styles.modalButtons}>
              <Button title="Eliminar" onPress={handleDelete} color="red" />
              <Button title="Cancelar" onPress={() => setConfirmDeleteVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  bold: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});
