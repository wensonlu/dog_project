import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';

const DogContext = createContext();

export const DogProvider = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dogs, setDogs] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const userId = user?.id || 'guest';

    // Fetch all dogs on mount
    useEffect(() => {
        const fetchDogs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/dogs`);
                if (res.ok) {
                    const data = await res.json();
                    setDogs(data);
                }
            } catch (error) {
                console.error("Error fetching dogs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDogs();
    }, []);

    // Fetch user's favorites when logged in
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user?.id) {
                setFavoriteIds([]);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/favorites/${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFavoriteIds(data.map(f => f.dog_id));
                }
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
        };
        fetchFavorites();
    }, [user?.id]);

    const toggleFavorite = async (dogId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, dogId })
            });
            const result = await res.json();

            if (result.status === 'added') {
                setFavoriteIds(prev => [...prev, dogId]);
            } else if (result.status === 'removed') {
                setFavoriteIds(prev => prev.filter(id => id !== dogId));
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const favorites = dogs.filter(dog => favoriteIds.includes(dog.id));

    return (
        <DogContext.Provider value={{ DOGS: dogs, favoriteIds, favorites, toggleFavorite, loading }}>
            {children}
        </DogContext.Provider>
    );
};

export const useDogs = () => useContext(DogContext);
