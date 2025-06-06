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
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type Review = {
  id: number;
  user: { id: number; name: string };
  product: { id: number; name: string };
  rating: number;
  comment?: string;
  title?: string;
};

const API_URL = 'http://localhost:8000/api/admin/reviews';

export default function ReviewsPage() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 200 : 180;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
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

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al obtener reseñas');

      // Debug: Mostrar la estructura de datos
      console.log('Estructura de datos recibida:', JSON.stringify(data, null, 2));
      
      // Verificar si viene en data.data o directamente en data
      const reviewsData = data.data || data.reviews || data;
      const sortedReviews = reviewsData.sort((a: Review, b: Review) => a.id - b.id);
      setReviews(sortedReviews);
    } catch (error: any) {
      console.error('Error completo:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${reviewToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('Reseña eliminada con éxito');
        fetchReviews();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la reseña');
    } finally {
      setConfirmDeleteVisible(false);
      setReviewToDelete(null);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  useEffect(() => {
    fetchReviews();
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
          <Text style={styles.welcomeText}>⭐ Reseñas</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ 
                paddingBottom: 20,
                paddingHorizontal: isMobile ? 0 : 0 
              }}
              // En móvil habilitar scroll horizontal si es necesario
              showsHorizontalScrollIndicator={isMobile}
              renderItem={({ item }) => (
                <View style={[styles.card, { 
                  backgroundColor: '#fff',
                  // En móvil hacer padding más pequeño
                  padding: isMobile ? 12 : 15,
                }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>
                      {item.title || 'Sin título'}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.rating}>{renderStars(item.rating)}</Text>
                      <Text style={styles.ratingNumber}>({item.rating}/5)</Text>
                    </View>
                  </View>
                  
                  <View style={styles.reviewInfo}>
    <Text style={styles.infoText}>
    <Text style={styles.infoLabel}>Usuario: </Text>
    {item.user?.name ?? 'Desconocido'}
   </Text>
   <Text style={styles.infoText}>
    <Text style={styles.infoLabel}>Producto: </Text>
       {item.product?.name ?? 'Desconocido'}
  </Text>
  </View>


                  {item.comment && (
                    <View style={styles.commentContainer}>
                      <Text style={styles.commentLabel}>Comentario:</Text>
                      <Text style={styles.commentText}>{item.comment}</Text>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setReviewToDelete(item.id);
                        setConfirmDeleteVisible(true);
                      }}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

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
                <Text style={styles.modalTitle}>¿Eliminar reseña?</Text>
                <Text style={{ marginBottom: 15 }}>
                  ¿Estás seguro de que deseas eliminar esta reseña?
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="Eliminar" onPress={handleDelete} color="red" />
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setConfirmDeleteVisible(false);
                      setReviewToDelete(null);
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
    backgroundColor: '#f8f9fa' 
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  
  // Improved Sidebar styling (copied from HomeScreen)
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    // En móvil hacer más compacto
    maxWidth: Platform.OS === 'web' ? '100%' : '100%',
  },

  reviewHeader: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'flex-start',
    marginBottom: 10,
  },

  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11101d',
    flex: 1,
    marginRight: Platform.OS === 'web' ? 10 : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 8,
  },

  ratingContainer: {
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-start',
  },

  rating: {
    fontSize: 16,
    marginBottom: 2,
  },

  ratingNumber: {
    fontSize: 12,
    color: '#666',
  },

  reviewInfo: {
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },

  infoLabel: {
    fontWeight: '600',
    color: '#11101d',
  },

  commentContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11101d',
    marginBottom: 5,
  },

  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    // En móvil permitir scroll horizontal si es muy largo
    flexWrap: 'wrap',
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  deleteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },

  deleteButtonText: {
    color: '#ff4e4e',
    fontWeight: '500',
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