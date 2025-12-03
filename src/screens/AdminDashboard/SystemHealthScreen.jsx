// --- INICIO DEL ARCHIVO: src\screens\AdminDashboard\SystemHealthScreen.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { IoCheckmarkCircle, IoAlertCircle, IoHeartCircleOutline } from "react-icons/io5";

const STATUS_MAP = {
    HEALTHY: { color: '#10b981', icon: <IoCheckmarkCircle size={24} /> }, // Verde de éxito
    CRITICAL: { color: '#ef4444', icon: <IoAlertCircle size={24} /> },     // Rojo de error
    UP: { color: '#10b981', icon: <IoCheckmarkCircle size={24} /> },
    DOWN: { color: '#ef4444', icon: <IoAlertCircle size={24} /> },
    SUCCESS: { color: '#10b981', icon: <IoCheckmarkCircle size={24} /> },
    FAILURE: { color: '#ef4444', icon: <IoAlertCircle size={24} /> },
    LOADING: { color: '#ff5722', icon: <IoHeartCircleOutline size={24} /> },// Rojo primario para carga
};

const SystemHealthScreen = () => {
    const [healthStatus, setHealthStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);
    const [apiError, setApiError] = useState(null);

    const runHealthCheck = useCallback(async () => {
        setLoading(true);
        setHealthStatus(null);
        setApiError(null);

        try {
            // Llamada al endpoint único de salud del sistema
            const response = await axios.get('/health_check', { timeout: 10000 }); // 10s timeout
            const data = response.data;

            // Almacenar el estado general y los detalles de los checks
            setHealthStatus({
                overallStatus: data.status,
                timestamp: data.timestamp,
                checks: data.checks || {},
            });

        } catch (error) {
            let message;
            if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
                message = `Sin respuesta (Timeout/Red) desde el servidor API.`;
            } else if (error.response) {
                message = `Error HTTP ${error.response.status} al intentar contactar /health-check.`;
            } else {
                message = `Error desconocido: ${error.message}`;
            }
            setApiError(message);
        } finally {
            setLastChecked(new Date());
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        runHealthCheck();
    }, [runHealthCheck]);

    // Estilos (Mercado Fake Dark Mode)
    const styles = {
        container: { maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#e0e0e0' },
        errorBox: { padding: '15px', backgroundColor: '#401818', color: '#ef4444', borderRadius: '8px', border: '1px solid #dc2626', fontWeight: 'bold', marginBottom: '15px' },
        card: (status) => ({
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: '#1e1e1e', 
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
        }),
        name: { fontWeight: '600', fontSize: '1.1rem' },
        statusText: (status) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            color: STATUS_MAP[status.toUpperCase()]?.color || STATUS_MAP.FAILURE.color,
        }),
        button: {
            padding: '10px 15px', 
            backgroundColor: '#ff5722', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            marginTop: '20px'
        },
        detailText: {
            fontSize: '0.9rem',
            color: '#bdbdbd',
            margin: '2px 0',
        }
    };

    const overallStatusKey = healthStatus?.overallStatus?.toUpperCase() || (loading ? 'LOADING' : 'FAILURE');
    const overallStyle = STATUS_MAP[overallStatusKey] || STATUS_MAP.FAILURE;

    return (
        <div style={styles.container}>
            <p style={{ color: '#bdbdbd', marginBottom: '20px' }}>
                Monitoreo de disponibilidad y performance de la API y sus servicios internos (`/health-check`).
            </p>

            {apiError && <div style={styles.errorBox}>{apiError}</div>}

            {/* ESTADO GENERAL */}
            <div style={{ ...styles.card(overallStatusKey), borderLeft: `4px solid ${overallStyle.color}` }}>
                <h2 style={{ margin: 0, color: '#e0e0e0' }}>
                    Estado General: 
                </h2>
                <div style={styles.statusText(overallStatusKey)}>
                    {overallStyle.icon}
                    {loading ? 'Realizando verificación...' : healthStatus.overallStatus.toUpperCase()}
                </div>
            </div>

            {/* DETALLES POR CHECK */}
            {healthStatus?.checks && Object.entries(healthStatus.checks).map(([checkName, checkData]) => {
                const statusKey = checkData.health?.toUpperCase() || checkData.status?.toUpperCase() || 'FAILURE';
                const checkStyle = STATUS_MAP[statusKey] || STATUS_MAP.FAILURE;

                return (
                    <div key={checkName} style={{ ...styles.card(statusKey), borderLeft: `4px solid ${checkStyle.color}` }}>
                        {/* COLUMNA IZQUIERDA: Nombre del Servicio */}
                        <span style={styles.name}>{checkName.toUpperCase()}</span>
                        
                        {/* COLUMNA DERECHA: Estado y Detalles Clave */}
                        <div style={{ textAlign: 'right' }}>
                            {/* Latencia DB */}
                            {checkData.latency_ms !== undefined && (
                                <p style={styles.detailText}>
                                    Latencia: <span style={{ color: checkStyle.color, fontWeight: 'bold' }}>{checkData.latency_ms.toFixed(2)} ms</span> (Crítico: {checkData.thresholds?.critical_ms}ms)
                                </p>
                            )}
                            {/* Utilización Pool */}
                            {checkData.utilization_percent !== undefined && (
                                <p style={styles.detailText}>
                                    Utilización Pool: <span style={{ color: checkStyle.color, fontWeight: 'bold' }}>{checkData.utilization_percent}%</span> (Capacidad: {checkData.total_capacity})
                                </p>
                            )}
                             {/* Estado General del Servicio (up/down) */}
                             {checkData.status !== undefined && checkData.latency_ms === undefined && (
                                <p style={styles.detailText}>
                                    Estado Servicio: <span style={{ color: checkStyle.color, fontWeight: 'bold' }}>{checkData.status.toUpperCase()}</span>
                                </p>
                            )}
                            {/* Health Status Final (Línea principal) */}
                            <p style={styles.statusText(statusKey)}>
                                {checkStyle.icon}
                                HEALTH: {statusKey}
                            </p>
                        </div>
                    </div>
                );
            })}

            <p style={{ color: '#bdbdbd', fontSize: '0.9rem', marginTop: '15px' }}>
                Última verificación: {lastChecked ? lastChecked.toLocaleTimeString() : 'N/A'}
            </p>

            <button 
                onClick={runHealthCheck} 
                disabled={loading}
                style={styles.button}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e64a19'}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
            >
                {loading ? 'Verificando...' : 'Re-ejecutar Verificación'}
            </button>
        </div>
    );
};

export default SystemHealthScreen;

// --- FIN DEL ARCHIVO: src\screens\AdminDashboard\SystemHealthScreen.jsx ---