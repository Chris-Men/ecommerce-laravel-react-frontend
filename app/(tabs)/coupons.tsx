import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000/api/admin/coupons';

type Coupon = {
  id: number;
  code: string;
  discount: number;
  type: 'fixed' | 'percent';
  expires_at?: string;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchCoupons();
  }, []);

  const formatDate = (date?: string) => {
    if (!date) return 'Sin fecha';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Fecha inválida';

    return new Intl.DateTimeFormat('es-SV', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cupones</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bold}>Código: {item.code}</Text>
              <Text>Descuento: {item.discount} {item.type === 'percent' ? '%' : '$'}</Text>
              <Text>Expira: {formatDate(item.expires_at)}</Text>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
});
