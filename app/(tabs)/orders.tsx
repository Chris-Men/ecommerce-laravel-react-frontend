import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://localhost:8000/api/admin/orders';

type Order = {
  id: number;
  user: { name: string };
  total: number;
  qty: number;
  delivered_at: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
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
      setOrders(data);
    } catch (error: any) {
      console.error('Error al obtener pedidos:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/${id}/delivered`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Éxito', data.message);
        fetchOrders();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error: any) {
      console.error('Error al actualizar:', error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón de regresar */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Pedidos</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.bold}>ID: {item.id}</Text>
              <Text>Usuario: {item.user?.name}</Text>
              <Text>Total: ${item.total}</Text>
              <Text>Cantidad: {item.qty}</Text>
              <Text>Entregado: {item.delivered_at ? 'Sí' : 'No'}</Text>
              <View style={styles.actions}>
                {!item.delivered_at && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: 'blue' }]}
                    onPress={() => markAsDelivered(item.id)}
                  >
                    <Text style={styles.buttonText}>Marcar Entregado</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
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
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-start',
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
