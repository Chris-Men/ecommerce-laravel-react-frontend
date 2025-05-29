import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://localhost:8000/api/admin/reviews';

type Review = {
  id: number;
  user: { id: number; name: string };
  product: { id: number; name: string };
  rating: number;
  comment?: string;
  title?: string;
};

export default function ReviewsPage() {
  const navigation = useNavigation();
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
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

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
              <Text>Usuario: {item.user?.name || 'Desconocido'}</Text>
              <Text>Producto: {item.product?.name || 'Desconocido'}</Text>
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
