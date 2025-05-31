import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type Order = {
  id: number;
  user: { name: string };
  total: number;
  qty: number;
  delivered_at: string | null;
  created_at: string;
};

const API_URL = 'http://localhost:8000/api/admin/orders';

export default function OrdersPage() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 140 : 180;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

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
          <Text style={styles.welcomeText}>📦 Pedidos</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: '#fff' }]}>
                  <Text style={[
                    styles.bold,
                    isMobile ? { marginLeft: 20 } : {},
                  ]}>
                    ID: {item.id}
                  </Text>
                  <Text>Usuario: {item.user?.name}</Text>
                  <Text>Total: ${item.total}</Text>
                  <Text>Cantidad: {item.qty}</Text>
                  <Text>Entregado: {item.delivered_at ? 'Sí' : 'No'}</Text>
                  <View style={styles.actions}>
                    {!item.delivered_at && (
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#4e8cff' }]}
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

  bold: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
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