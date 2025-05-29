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

const API_URL = 'http://localhost:8000/api/admin/reviews';

type Review = {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
  title?: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
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
      setReviews(json.data);
    } catch (error: any) {
      console.error('Error al obtener reseñas:', error.message);
      Alert.alert('Error', 'No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reseñas</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bold}>Título: {item.title || 'Sin título'}</Text>
              <Text>Usuario ID: {item.user_id}</Text>
              <Text>Producto ID: {item.product_id}</Text>
              <Text>Calificación: {item.rating} ⭐</Text>
              <Text>Comentario: {item.comment || 'Sin comentario'}</Text>
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
